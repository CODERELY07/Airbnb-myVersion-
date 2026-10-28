import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { activeReservationFilter, BASE_URL, DAY_PATTERN, getNights, isPaymentEnabled, manilaMidnight, PAYMENT_UNAVAILABLE_MESSAGE, PENDING_PAYMENT_MINUTES } from '@/lib/utils';
import { paymongo } from '@/lib/paymongo';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MAX_NIGHTS = 90;
// Unpaid bookings one guest may hold at the same time (stops one account blocking many dates)
const MAX_PENDING_PER_GUEST = 2;

const bodySchema = z.object({
  listingId: z.string().uuid(),
  // calendar days, e.g. "2026-11-10"
  checkIn: z.string().regex(DAY_PATTERN),
  checkOut: z.string().regex(DAY_PATTERN),
});

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Payment keys missing: don't create a reservation at all
    if (!isPaymentEnabled()) {
      return NextResponse.json(
        { error: PAYMENT_UNAVAILABLE_MESSAGE },
        { status: 503 }
      );
    }

    // Only trust ids and dates from the client. Price is calculated here.
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Missing or invalid fields' },
        { status: 400 }
      );
    }

    const { listingId } = parsed.data;
    const checkIn = manilaMidnight(parsed.data.checkIn).toISOString();
    const checkOut = manilaMidnight(parsed.data.checkOut).toISOString();

    // No past check-ins (today is fine), no endless stays
    const nights = getNights(new Date(checkIn), new Date(checkOut));
    const startsInPast = Date.parse(checkIn) < Date.now() - 24 * 60 * 60 * 1000;

    if (nights <= 0 || nights > MAX_NIGHTS || startsInPast) {
      return NextResponse.json(
        { error: 'Invalid dates' },
        { status: 400 }
      );
    }

    const { data: listing } = await supabase
      .from('listings')
      .select('price, "userId"')
      .eq('id', listingId)
      .single();

    if (!listing?.price) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.userId === user.id) {
      return NextResponse.json(
        { error: "You can't book your own listing." },
        { status: 400 }
      );
    }

    const totalPrice = nights * Number(listing.price);
    const amount = Math.round(totalPrice * 100); // PayMongo uses centavos

    // The guest is starting over: drop their own unpaid attempts for this listing
    await supabase
      .from("reservation")
      .delete()
      .eq("listingId", listingId)
      .eq("userId", user.id)
      .eq("isPaid", false);

    // Limit how many unpaid bookings one guest can hold at once
    const pendingSince = new Date(Date.now() - PENDING_PAYMENT_MINUTES * 60 * 1000).toISOString();
    const { count: pendingCount } = await supabase
      .from("reservation")
      .select("id", { count: "exact", head: true })
      .eq("userId", user.id)
      .eq("isPaid", false)
      .gt("created_at", pendingSince);

    if ((pendingCount ?? 0) >= MAX_PENDING_PER_GUEST) {
      return NextResponse.json(
        { error: 'You have unfinished payments. Complete or cancel them, or try again in a few minutes.' },
        { status: 429 }
      );
    }

    // Do the dates overlap a paid booking or a payment in progress? (checkout day is free for the next guest)
    const { data: overlapping, error: overlapError } = await supabase
      .from("reservation_dates")
      .select("listingId")
      .eq("listingId", listingId)
      .lt("startDate", checkOut)
      .gt("endDate", checkIn)
      .or(activeReservationFilter())
      .limit(1);

    if (overlapError) {
      // Never take a booking when availability can't be checked
      console.error("Availability check failed:", overlapError);
      return NextResponse.json(
        { error: 'Unable to check availability. Please try again.' },
        { status: 500 }
      );
    }

    if (overlapping && overlapping.length > 0) {
      return NextResponse.json(
        { error: 'These dates are already booked. Please choose other dates.' },
        { status: 409 }
      );
    }

    // Create reservation in Supabase
    const { data: reservation, error: reservationError } = await supabase
      .from('reservation')
      .insert({
        userId: user.id,
        listingId: listingId,
        startDate: checkIn,
        endDate: checkOut,
        nights,
        totalPrice: totalPrice,
        isPaid: false,
      })
      .select()
      .single();

    if (reservationError || !reservation) {
      console.log('Reservation creation error:', reservationError);
      return NextResponse.json(
        { error: 'Failed to create reservation' },
        { status: 500 }
      );
    }

    // Create PayMongo payment source
    const paymongoData = await paymongo('/sources', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          attributes: {
            amount,
            currency: 'PHP',
            type: 'gcash',
            redirect: {
              success: `${BASE_URL}/payment/success?reservation_id=${reservation.id}`,
              failed: `${BASE_URL}/payment/failed?reservation_id=${reservation.id}`,
            },

            billing: {
              name: user.email || 'Guest',
              email: user.email || '',
            },
            metadata: {
              reservation_id: reservation.id,
              user_id: user.id,
              listing_id: listingId,
            },
          },
        },
      }),
    });

    if (paymongoData.errors || !paymongoData.data?.id) {

      await supabase.from('reservation').delete().eq('id', reservation.id);

      console.error('PayMongo error:', paymongoData.errors);
      return NextResponse.json(
        { error: 'Could not start the payment. Please try again.' },
        { status: 502 }
      );
    }

    // Save the source id so verify / webhook can confirm it later
    const { error: saveError } = await createAdminClient()
      .from('reservation')
      .update({ paymentSourceId: paymongoData.data.id })
      .eq('id', reservation.id);

    if (saveError) {
      // Without it the payment could never be matched to the booking: don't send the guest to pay
      console.error('Could not save payment source:', saveError);
      await supabase.from('reservation').delete().eq('id', reservation.id);
      return NextResponse.json(
        { error: 'Could not start the payment. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(paymongoData, { status: 200 });
  } catch (err) {
    // Log details on the server, send a generic message to the client
    console.error('Payment API error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

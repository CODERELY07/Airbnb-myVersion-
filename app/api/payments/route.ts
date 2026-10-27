import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { activeReservationFilter, BASE_URL, getNights, isPaymentEnabled, PAYMENT_UNAVAILABLE_MESSAGE } from '@/lib/utils';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const MAX_NIGHTS = 90;
const isDate = (v: string) => !Number.isNaN(Date.parse(v));

const bodySchema = z.object({
  listingId: z.string().uuid(),
  checkIn: z.string().refine(isDate),
  checkOut: z.string().refine(isDate),
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

    const { listingId, checkIn, checkOut } = parsed.data;

    // No past check-ins (1 day of slack for time zones), no endless stays
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

    // Check if user already has a reservation for this listing
    const { data: existingReservations, error: fetchError } = await supabase
      .from("reservation")
      .select("id")
      .eq("listingId", listingId)
      .eq("userId", user.id)
      .limit(1);

    if (fetchError) {
      console.error("Error checking existing reservations:", fetchError);
      return NextResponse.json(
        { error: 'Unable to verify reservation availability' },
        { status: 500 }
      );
    }

    if (existingReservations && existingReservations.length > 0) {
      return NextResponse.json(
        { error: 'You already have a reservation for this listing. Please check your reservations.' },
        { status: 409 }
      );
    }

    // Check if the dates overlap someone else's reservation (public dates view)
    const { data: overlapping } = await supabase
      .from("reservation_dates")
      .select("id")
      .eq("listingId", listingId)
      .lt("startDate", checkOut)
      .gt("endDate", checkIn)
      .or(activeReservationFilter())
      .limit(1);

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
    const paymongoResponse = await fetch('https://api.paymongo.com/v1/sources', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(
          process.env.PAYMONGO_SECRET_KEY + ':'
        ).toString('base64')}`,
        'Content-Type': 'application/json',
      },
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

    const paymongoData = await paymongoResponse.json();

    if (paymongoData.errors) {

      await supabase.from('reservation').delete().eq('id', reservation.id);

      console.error('PayMongo error:', paymongoData.errors);
      return NextResponse.json(
        { error: 'Could not start the payment. Please try again.' },
        { status: 502 }
      );
    }

    // Save the source id so /api/payments/verify can confirm it later
    await createAdminClient()
      .from('reservation')
      .update({ paymentSourceId: paymongoData.data.id })
      .eq('id', reservation.id);

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

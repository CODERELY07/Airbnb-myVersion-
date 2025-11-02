import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    const {
      amount,
      listingId,
      userId,
      checkIn,
      checkOut,
      nights,
      totalPrice,
    } = await req.json();

    // Validate input
    if (!amount || !listingId || !checkIn || !checkOut || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify user matches
    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'User mismatch' },
        { status: 403 }
      );
    }

    // Check if user already has a reservation for this listing
    const { data: existingReservations, error: fetchError } = await supabase
      .from("reservation")
      .select("id")
      .eq("listingId", listingId)
      .eq("userId", userId)
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
        { error: '' },
        { status: 409 }
      );
    }

    // Create reservation in Supabase 
    const { data: reservation, error: reservationError } = await supabase
      .from('reservation')
      .insert({
        userId: userId,
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

    if (!process.env.PAYMONGO_SECRET_KEY) {
    
      await supabase.from('reservation').delete().eq('id', reservation.id);
      
      return NextResponse.json(
      { error: 'Payment configuration error' },
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
              success: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/success?reservation_id=${reservation.id}`,
              failed: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/payment/failed?reservation_id=${reservation.id}`,
            },
            // Store reservation metadata
            billing: {
              name: user.email || 'Guest',
              email: user.email || '',
            },
            metadata: {
              reservation_id: reservation.id,
              user_id: userId,
              listing_id: listingId,
            },
          },
        },
      }),
    });

    const paymongoData = await paymongoResponse.json();
    console.log('PayMongo response:', JSON.stringify(paymongoData, null, 2));

    if (paymongoData.errors) {
      
      await supabase.from('reservation').delete().eq('id', reservation.id);
      
      return NextResponse.json(
        { error: paymongoData.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(paymongoData, { status: 200 });
  } catch (err) {
    console.error('Payment API error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { isPaymentEnabled, PAYMENT_UNAVAILABLE_MESSAGE } from '@/lib/utils';
import { confirmReservationPayment } from '@/lib/paymongo';

// Called by /payment/success when the guest comes back from GCash.
// The webhook (/api/payments/webhook) does the same if the guest never comes back.
export async function POST(req: NextRequest) {
  try {
    if (!isPaymentEnabled()) {
      return NextResponse.json({ error: PAYMENT_UNAVAILABLE_MESSAGE }, { status: 503 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { reservationId } = await req.json().catch(() => ({}));

    if (typeof reservationId !== 'string' || !reservationId) {
      return NextResponse.json({ error: 'Missing reservation' }, { status: 400 });
    }

    const { data: reservation } = await createAdminClient()
      .from('reservation')
      .select('id, "totalPrice", "isPaid", "paymentSourceId"')
      .eq('id', reservationId)
      .eq('userId', user.id)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    const result = await confirmReservationPayment(reservation);

    switch (result) {
      case 'paid':
        return NextResponse.json({ success: true });
      case 'pending':
        return NextResponse.json({ error: 'Payment not completed yet' }, { status: 402 });
      case 'conflict':
        return NextResponse.json(
          { error: 'These dates were just booked by someone else. Your payment is being refunded.' },
          { status: 409 }
        );
      default:
        return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
    }
  } catch (err) {
    console.error('Payment verify error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

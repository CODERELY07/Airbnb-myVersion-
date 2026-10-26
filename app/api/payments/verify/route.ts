import { createClient } from '@/utils/supabase/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';
import { isPaymentEnabled, PAYMENT_UNAVAILABLE_MESSAGE } from '@/lib/utils';

// Called by /payment/success. Confirms the GCash payment with PayMongo
// on the server before marking the reservation as paid.
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

    const { reservationId } = await req.json();
    const admin = createAdminClient();

    const { data: reservation } = await admin
      .from('reservation')
      .select('id, "totalPrice", "isPaid", "paymentSourceId"')
      .eq('id', reservationId)
      .eq('userId', user.id)
      .single();

    if (!reservation?.paymentSourceId) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    if (reservation.isPaid) {
      return NextResponse.json({ success: true });
    }

    const authHeader = `Basic ${Buffer.from(process.env.PAYMONGO_SECRET_KEY + ':').toString('base64')}`;

    // 1. The source must be authorized by the user in GCash
    const sourceRes = await fetch(`https://api.paymongo.com/v1/sources/${reservation.paymentSourceId}`, {
      headers: { Authorization: authHeader },
    });
    const source = await sourceRes.json();

    if (source?.data?.attributes?.status !== 'chargeable') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 402 });
    }

    // 2. Charge the source
    const paymentRes = await fetch('https://api.paymongo.com/v1/payments', {
      method: 'POST',
      headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          attributes: {
            amount: source.data.attributes.amount,
            currency: 'PHP',
            source: { id: reservation.paymentSourceId, type: 'source' },
          },
        },
      }),
    });
    const payment = await paymentRes.json();

    if (payment?.data?.attributes?.status !== 'paid') {
      return NextResponse.json({ error: 'Payment failed' }, { status: 402 });
    }

    // 3. Mark as paid
    const { error } = await admin
      .from('reservation')
      .update({ isPaid: true })
      .eq('id', reservation.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Payment verify error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

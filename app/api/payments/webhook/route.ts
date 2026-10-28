import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/utils/supabase/admin';
import { confirmReservationPayment, isValidWebhookSignature } from '@/lib/paymongo';

// PayMongo calls this when a GCash payment is authorized (event: source.chargeable),
// so bookings are confirmed even if the guest closes the browser before returning.
// Setup: docs/DOCUMENTATION.md → "PayMongo webhook".
export async function POST(req: NextRequest) {
  if (!process.env.PAYMONGO_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  const rawBody = await req.text();

  if (!isValidWebhookSignature(req.headers.get('paymongo-signature'), rawBody)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  try {
    const event = JSON.parse(rawBody)?.data?.attributes;

    // Other events are acknowledged and ignored
    if (event?.type !== 'source.chargeable') {
      return NextResponse.json({ received: true });
    }

    const sourceId = event.data?.id;
    const { data: reservation } = await createAdminClient()
      .from('reservation')
      .select('id, "totalPrice", "isPaid", "paymentSourceId"')
      .eq('paymentSourceId', sourceId)
      .maybeSingle();

    if (!reservation) {
      // e.g. the guest cancelled and the unpaid reservation was removed
      console.error(`Webhook: no reservation for source ${sourceId}`);
      return NextResponse.json({ received: true });
    }

    const result = await confirmReservationPayment(reservation);
    return NextResponse.json({ received: true, result });
  } catch (err) {
    // 500 makes PayMongo retry later
    console.error('Payment webhook error:', err);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}

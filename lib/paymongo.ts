import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createAdminClient } from "@/utils/supabase/admin";

const API = "https://api.paymongo.com/v1";

// Small PayMongo client (secret key, server only). Returns the parsed JSON body.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function paymongo(path: string, init: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${Buffer.from(`${process.env.PAYMONGO_SECRET_KEY}:`).toString("base64")}`,
      "Content-Type": "application/json",
      ...init.headers,
    },
    cache: "no-store",
  });
  return res.json().catch(() => ({ errors: [{ detail: `HTTP ${res.status}` }] }));
}

export type ConfirmResult =
  | "paid" // booking confirmed (now or earlier)
  | "pending" // guest hasn't authorized the payment yet
  | "failed" // payment expired, cancelled or declined
  | "conflict"; // paid, but the dates were taken meanwhile: refunded

interface ReservationToConfirm {
  id: string;
  isPaid: boolean;
  totalPrice: number | string;
  paymentSourceId: string | null;
}

/**
 * Charges an authorized GCash source and marks the reservation as paid.
 * Called by /api/payments/verify (guest returns) and /api/payments/webhook (PayMongo).
 * Safe to call more than once and from both at the same time.
 */
export async function confirmReservationPayment(reservation: ReservationToConfirm): Promise<ConfirmResult> {
  if (reservation.isPaid) return "paid";
  if (!reservation.paymentSourceId) return "failed";

  const sourceId = reservation.paymentSourceId;
  const expectedAmount = Math.round(Number(reservation.totalPrice) * 100);

  const source = (await paymongo(`/sources/${sourceId}`))?.data?.attributes;
  if (!source) return "pending";

  // Never charge a different amount than what we priced
  if (source.amount !== expectedAmount) {
    console.error(`Amount mismatch for reservation ${reservation.id}: ${source.amount} vs ${expectedAmount}`);
    return "failed";
  }

  let paymentId: string | null = null;

  if (source.status === "chargeable") {
    const payment = await paymongo("/payments", {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            amount: expectedAmount,
            currency: "PHP",
            source: { id: sourceId, type: "source" },
            description: `Reservation ${reservation.id}`,
            metadata: { reservation_id: reservation.id },
          },
        },
      }),
    });

    const status = payment?.data?.attributes?.status;
    if (status === "paid") {
      paymentId = payment.data.id;
    } else {
      // The other caller (webhook or verify) may have charged it a moment ago
      const again = (await paymongo(`/sources/${sourceId}`))?.data?.attributes?.status;
      if (again !== "paid") {
        console.error(`Payment failed for reservation ${reservation.id}:`, payment?.errors ?? status);
        return status === "pending" ? "pending" : "failed";
      }
    }
  } else if (source.status !== "paid") {
    return source.status === "pending" ? "pending" : "failed";
  }

  // Mark as paid. The database refuses two paid bookings with overlapping dates.
  const admin = createAdminClient();
  const markPaid = (withPaymentId: boolean) =>
    admin
      .from("reservation")
      .update({ isPaid: true, ...(withPaymentId && paymentId && { paymentId }) })
      .eq("id", reservation.id);

  let { error } = await markPaid(true);
  // "paymentId" column missing (schema.sql not re-run yet): still confirm the booking
  if (error && (error.code === "PGRST204" || error.code === "42703")) {
    ({ error } = await markPaid(false));
  }

  if (!error) return "paid";

  if (error.code === "23P01") {
    // Someone else paid for these dates first: give this guest their money back
    console.error(`Double booking prevented for reservation ${reservation.id}; refunding`);
    if (paymentId) await refundPayment(paymentId, expectedAmount);
    await admin.from("reservation").delete().eq("id", reservation.id).eq("isPaid", false);
    return "conflict";
  }

  console.error(`Could not mark reservation ${reservation.id} as paid:`, error);
  throw new Error("Could not save the payment");
}

export async function refundPayment(paymentId: string, amount: number) {
  const refund = await paymongo("/refunds", {
    method: "POST",
    body: JSON.stringify({
      data: { attributes: { amount, payment_id: paymentId, reason: "others", notes: "Dates no longer available" } },
    }),
  });
  if (refund?.errors) console.error(`Refund failed for payment ${paymentId}: refund it in the PayMongo dashboard`, refund.errors);
  return !refund?.errors;
}

/**
 * Checks the Paymongo-Signature header: "t=<timestamp>,te=<test sig>,li=<live sig>".
 * Signature = HMAC-SHA256(webhook secret, "<timestamp>.<raw body>").
 */
export function isValidWebhookSignature(header: string | null, rawBody: string) {
  const secret = process.env.PAYMONGO_WEBHOOK_SECRET;
  if (!secret || !header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.split("=");
      return [key.trim(), rest.join("=").trim()];
    })
  );
  if (!parts.t) return false;

  // Reject old deliveries (replays)
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 60 * 10) return false;

  const expected = createHmac("sha256", secret).update(`${parts.t}.${rawBody}`).digest("hex");
  const given = process.env.PAYMONGO_SECRET_KEY?.startsWith("sk_live_") ? parts.li : parts.te;
  if (!given || given.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(given), Buffer.from(expected));
}

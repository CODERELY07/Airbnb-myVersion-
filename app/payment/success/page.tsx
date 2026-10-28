"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/app/components/StatusCard";

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const reservationId = searchParams.get("reservation_id");
  const verified = useRef(false);

  useEffect(() => {
    // run once (React dev mode runs effects twice)
    if (verified.current) return;
    verified.current = true;

    if (!reservationId) {
      setStatus("error");
      return;
    }

    // Payment is verified on the server, the browser can't mark it paid
    fetch("/api/payments/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reservationId }),
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          // 409: dates taken while paying, the payment is refunded
          if (res.status === 409 && typeof body.error === "string") setMessage(body.error);
          throw new Error(`verify failed: ${res.status}`);
        }
        setStatus("success");
        setTimeout(() => router.push("/reservations"), 3000);
      })
      .catch((err) => {
        console.error("Error verifying payment:", err);
        setStatus("error");
      });
  }, [reservationId, router]);

  if (status === "loading") {
    return <StatusCard tone="loading" title="Confirming your payment" description="This only takes a moment. Please don't close this page." />;
  }

  if (status === "success") {
    return (
      <StatusCard tone="success" title="You're booked!" description="Your payment went through. Taking you to your reservations…">
        <Button asChild className="h-11 rounded-xl">
          <Link href="/reservations">View reservations</Link>
        </Button>
      </StatusCard>
    );
  }

  return (
    <StatusCard
      tone="error"
      title="We couldn't confirm your payment"
      description={
        message ??
        "If GCash charged you, it may take a minute to show up. Check your reservations, or try booking again."
      }
    >
      <Button asChild className="h-11 rounded-xl">
        <Link href="/reservations">Check reservations</Link>
      </Button>
      <Button asChild variant="ghost" className="h-11 rounded-xl">
        <Link href="/">Back to stays</Link>
      </Button>
    </StatusCard>
  );
}

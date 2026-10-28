"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatPrice, getNights, PAYMENT_UNAVAILABLE_MESSAGE } from "@/lib/utils";
import AuthForm from "./Auth/AuthForm";

const fieldDate: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export default function ReservationCard({
  userId,
  checkIn,
  checkOut,
  listingPrice,
  listingId,
  paymentsEnabled = true,
  isOwner = false,
}: {
  userId: string;
  checkIn?: Date;
  checkOut?: Date;
  listingPrice: number;
  listingId: string;
  paymentsEnabled?: boolean;
  isOwner?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  const nights = checkIn && checkOut ? getNights(checkIn, checkOut) : 0;
  const total = nights * listingPrice;

  const handlePayment = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      setError("Please select valid check-in and check-out dates.");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // price is calculated on the server
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // calendar days; the server turns them into Manila midnight
        body: JSON.stringify({ listingId, checkIn: format(checkIn, "yyyy-MM-dd"), checkOut: format(checkOut, "yyyy-MM-dd") }),
      });
      const data = await res.json().catch(() => ({}));
      const checkoutUrl = data?.data?.attributes?.redirect?.checkout_url;

      if (!res.ok || !checkoutUrl) {
        setError(typeof data.error === "string" ? data.error : "Could not start the payment. Please try again.");
        setLoading(false);
        return;
      }

      // GCash checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      console.error("Payment error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // One place for the button state
  let action;
  if (isOwner) {
    action = { label: "This is your listing", disabled: true, note: "Hosts can't book their own place." };
  } else if (!paymentsEnabled) {
    action = { label: "Reserve", disabled: true, note: PAYMENT_UNAVAILABLE_MESSAGE };
  } else if (!userId) {
    action = { label: "Log in to book", disabled: false, onClick: () => setShowAuth(true), note: "You won't be charged yet." };
  } else {
    action = {
      label: "Reserve with GCash",
      disabled: loading || nights <= 0,
      onClick: handlePayment,
      note: nights > 0 ? "You'll finish payment on GCash." : "Pick your dates in the calendar.",
    };
  }

  return (
    <div className="rounded-2xl border bg-card p-6 shadow-lg">
      <p className="flex items-baseline gap-1.5">
        <span className="font-display text-2xl font-medium">{formatPrice(listingPrice)}</span>
        <span className="text-sm text-muted-foreground">/ night</span>
      </p>

      <div className="mt-5 grid grid-cols-2 overflow-hidden rounded-xl border">
        <DateField label="Check-in" date={checkIn} />
        <DateField label="Checkout" date={checkOut} className="border-l" />
      </div>

      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button
        size="lg"
        onClick={action.onClick}
        disabled={action.disabled}
        className="mt-5 h-12 w-full rounded-xl text-[15px] font-semibold"
      >
        {loading && <Loader2 className="animate-spin" />}
        {loading ? "Starting payment…" : action.label}
      </Button>
      <p className="mt-3 text-center text-xs text-muted-foreground">{action.note}</p>

      {nights > 0 && (
        <dl className="mt-6 space-y-3 border-t pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">
              {formatPrice(listingPrice)} × {nights} night{nights === 1 ? "" : "s"}
            </dt>
            <dd>{formatPrice(total)}</dd>
          </div>
          <div className="flex justify-between border-t pt-3 font-semibold">
            <dt>Total</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
      )}

      {showAuth && <AuthForm toggleClick={() => setShowAuth(false)} />}
    </div>
  );
}

function DateField({ label, date, className }: { label: string; date?: Date; className?: string }) {
  return (
    <div className={cn("px-4 py-3", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-wide">{label}</p>
      <p className={cn("mt-0.5 text-sm", !date && "text-muted-foreground")}>
        {date ? date.toLocaleDateString("en-US", fieldDate) : "Add date"}
      </p>
    </div>
  );
}

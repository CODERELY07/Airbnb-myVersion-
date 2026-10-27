"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/app/components/StatusCard";
import { createClient } from "@/utils/supabase/client";

export default function PaymentFailed() {
  const reservationId = useSearchParams().get("reservation_id");

  useEffect(() => {
    if (!reservationId) return;
    // Free the dates: remove the unpaid attempt (RLS: only your own rows)
    createClient().from("reservation").delete().eq("id", reservationId).eq("isPaid", false).then();
  }, [reservationId]);

  return (
    <StatusCard
      tone="error"
      title="Payment not completed"
      description="Nothing was charged. Your dates were released, so you can try again whenever you're ready."
    >
      <Button asChild className="h-11 rounded-xl">
        <Link href="/">Back to stays</Link>
      </Button>
    </StatusCard>
  );
}

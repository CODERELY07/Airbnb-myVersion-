"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Heart, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

// Primary submit for multi-step forms
export function SubmitButtons({ label = "Next" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" size="lg" disabled={pending} className="min-w-28 rounded-full">
      {pending ? (
        <>
          <Loader2 className="animate-spin" />
          Saving
        </>
      ) : (
        label
      )}
    </Button>
  );
}

// Heart on listing cards
export function FavoriteButton({ active }: { active: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? "Remove from favorites" : "Save to favorites"}
      className="grid size-9 place-items-center rounded-full bg-white/95 shadow-md ring-1 ring-black/5 transition hover:scale-105 active:scale-95 disabled:opacity-70"
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <Heart
          className={cn("size-[18px]", active ? "fill-primary text-primary" : "text-foreground")}
          strokeWidth={2}
        />
      )}
    </button>
  );
}

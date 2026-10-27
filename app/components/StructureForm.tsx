"use client";

import { useActionState } from "react";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { SelectedCategory } from "@/app/components/SelectedCategory";
import { StepHeader } from "@/app/components/StepHeader";
import { createCategoryAction } from "@/lib/supabase/listings";

export function StructureForm({ listingId }: { listingId: string }) {
  const [state, formAction] = useActionState<{ error: string | null }, FormData>(createCategoryAction, {
    error: null,
  });

  return (
    <form action={formAction}>
      <input type="hidden" name="listingId" value={listingId} />
      <StepHeader
        step={1}
        title="Which of these best describes your home?"
        description="Pick the one guests should find it under."
        error={state?.error}
      />
      <SelectedCategory />
      <CreationBottomBar step={1} />
    </form>
  );
}

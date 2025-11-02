
"use client"

import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { SelectedCategory } from "@/app/components/SelectedCategory";
import { createCategoryAction } from "@/lib/supabase/listings";
import { useActionState } from "react";

interface StructureFormProps {
  listingId: string;
}

interface FormState {
  error: string | null;
}

export function StructureForm({ listingId }: StructureFormProps) {
  const initialState: FormState = { error: null };
  const [state, formAction] = useActionState<FormState, FormData>(
    createCategoryAction, 
    initialState
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="listingId" value={listingId} />
      
      {state?.error && (
        <div className="mb-4 p-3 sm:p-4 bg-red-50 border max-w-3xl my-3 mx-4 sm:mx-auto border-red-200 rounded-lg">
          <p className="text-xs sm:text-sm font-medium">{state.error}</p>
        </div>
      )}
      
      <SelectedCategory />
      <CreationBottomBar />
    </form>
  );
}
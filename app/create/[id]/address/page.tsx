import { AddressFields } from "@/app/components/AddressFields";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { StepHeader } from "@/app/components/StepHeader";
import { createLocation } from "@/lib/supabase/listings";

export default async function AddressRoute({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  return (
    <form action={createLocation}>
      <input type="hidden" name="listingId" value={id} />
      <StepHeader step={3} title="Where is your home?" description="Guests search by province, so pick the exact barangay." error={error} />
      <AddressFields />
      <CreationBottomBar step={3} />
    </form>
  );
}

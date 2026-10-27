import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { DescriptionFields } from "@/app/components/DescriptionFields";
import { StepHeader } from "@/app/components/StepHeader";
import { createDescription } from "@/lib/supabase/listings";

export default async function DescriptionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  return (
    <form action={createDescription}>
      <input type="hidden" name="listingId" value={id} />
      <StepHeader step={2} title="Describe your home" description="A clear title, a good photo and an honest description go a long way." error={error} />
      <DescriptionFields />
      <CreationBottomBar step={2} />
    </form>
  );
}

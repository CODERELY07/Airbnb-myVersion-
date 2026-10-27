import { redirect } from "next/navigation";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { DescriptionFields } from "@/app/components/DescriptionFields";
import { StepHeader } from "@/app/components/StepHeader";
import { getOwnListing, updateListingDescription } from "@/lib/supabase/listings";

export default async function EditDescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch only this listing, and only if you own it
  const listing = await getOwnListing(id);
  if (!listing) return redirect("/my-listings");

  return (
    <form action={updateListingDescription}>
      <input type="hidden" name="listingId" value={id} />
      <StepHeader step={2} title="Update the details" description={listing.title ?? undefined} />
      <DescriptionFields defaults={listing} />
      <CreationBottomBar step={2} cancelHref="/my-listings" />
    </form>
  );
}

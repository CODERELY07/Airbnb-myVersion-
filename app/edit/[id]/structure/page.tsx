import { redirect } from "next/navigation";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { SelectedCategory } from "@/app/components/SelectedCategory";
import { StepHeader } from "@/app/components/StepHeader";
import { getOwnListing, updateListingCategory } from "@/lib/supabase/listings";

export default async function EditStructureRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch only this listing, and only if you own it
  const listing = await getOwnListing(id);
  if (!listing) return redirect("/my-listings");

  return (
    <form action={updateListingCategory}>
      <input type="hidden" name="listingId" value={id} />
      <StepHeader step={1} title="Update the category" description={listing.title ?? undefined} />
      <SelectedCategory defaultCategory={listing.categoryName as string} />
      <CreationBottomBar step={1} cancelHref="/my-listings" />
    </form>
  );
}

import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { SelectedCategory } from "@/app/components/SelectedCategory";
import { getOwnListing, updateListingCategory } from "@/lib/supabase/listings";
import { redirect } from "next/navigation";

export default async function EditStructureRoute({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // Fetch only this listing, and only if you own it
  const listing = await getOwnListing(id);

  if (!listing) {
    return redirect("/my-listings");
  }

  return (
    <>
      <div className="w-3/5 mx-auto">
        <h2 className="text-3xl font-semibold tracking-tight transition-colors">
          Update your Home Category
        </h2>
      </div>

      <form action={updateListingCategory}>
        <input type="hidden" name="listingId" value={id} />
        <SelectedCategory defaultCategory={listing.categoryName as string} />
        <CreationBottomBar />
      </form>
    </>
  );
}


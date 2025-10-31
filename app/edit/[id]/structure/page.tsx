import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { SelectedCategory } from "@/app/components/SelectedCategory";
import { updateListingCategory } from "@/lib/supabase/listings";
import { serverCaller } from "@/trpc/server";
import { redirect } from "next/navigation";

export default async function EditStructureRoute({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params;

  // Fetch existing listing data
  const listings = await serverCaller.listings.fetchListings({});
  const listing = listings.find((l) => l.id === id);

  if (!listing) {
    return redirect("/my-homes");
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


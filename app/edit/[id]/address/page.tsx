import { redirect } from "next/navigation";
import { AddressFields } from "@/app/components/AddressFields";
import { CreationBottomBar } from "@/app/components/CreationBottomBar";
import { StepHeader } from "@/app/components/StepHeader";
import { getOwnListing, updateListingLocation } from "@/lib/supabase/listings";

export default async function EditAddressRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Fetch only this listing, and only if you own it; its address prefills the form
  const listing = await getOwnListing(id);
  if (!listing) return redirect("/my-listings");

  return (
    <form action={updateListingLocation}>
      <input type="hidden" name="listingId" value={id} />
      <StepHeader step={3} title="Update the location" description={listing.title ?? undefined} />
      <AddressFields
        initial={{
          regionCode: listing.regionCode,
          provinceCode: listing.provinceCode,
          munCityCode: listing.munCityCode,
          barangayCode: listing.barangayCode,
        }}
      />
      <CreationBottomBar step={3} cancelHref="/my-listings" submitLabel="Save" />
    </form>
  );
}

import { redirect } from "next/navigation";
import { House } from "lucide-react";
import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { ListingGrid } from "../components/ListingGrid";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { UpdateListingCard } from "../components/UpdateListingCard";
import { getListingLocation } from "../lib/locationHelpers";

export default async function MyHomes() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id;
  if (!userId) return redirect("/");

  const listings = await serverCaller.listings.fetchListings({ userId });

  return (
    <div className="page-container">
      <PageHeader title="My listings" description="Edit or remove the homes you host." />

      {!listings?.length ? (
        <EmptyState
          icon={House}
          title="You haven't listed a home yet"
          description="Open the menu and choose “List your home” to create your first listing."
        />
      ) : (
        <ListingGrid>
          {listings.map((listing) => (
            <UpdateListingCard
              key={listing.id}
              listingId={listing.id}
              imagePath={listing.photo}
              title={listing.title}
              subtitle={getListingLocation(listing)}
              price={listing.price}
            />
          ))}
        </ListingGrid>
      )}
    </div>
  );
}

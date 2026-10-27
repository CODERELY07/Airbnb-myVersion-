import { Suspense } from "react";
import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { MapFilterItems } from "../components/MapFilterItems";
import { ListingCard } from "../components/ListingCard";
import { ListingGrid, ListingGridSkeleton } from "../components/ListingGrid";
import { NoListings } from "../components/NoListings";
import { getListingLocation } from "../lib/locaitonHelpers";

interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  bedrooms?: string;
  bathrooms?: string;
}

// "3" -> 3, anything else -> undefined
const toCount = (value?: string) => {
  const n = Number.parseInt(value ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
};

async function ShowSearchResults({ searchParams, userId }: { searchParams: SearchParams; userId?: string }) {
  const listings = await serverCaller.listings.searchListings({
    destination: searchParams.destination,
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
    guests: toCount(searchParams.guests),
    bedrooms: toCount(searchParams.bedrooms),
    bathrooms: toCount(searchParams.bathrooms),
  });

  if (!listings?.length) {
    return (
      <NoListings
        title="No matching stays"
        description="Try other dates, fewer guests or another province."
        action={{ href: "/", label: "Browse all stays" }}
      />
    );
  }

  return (
    <>
      <p className="mb-6 text-sm text-muted-foreground">
        {listings.length} stay{listings.length === 1 ? "" : "s"} available
      </p>
      <ListingGrid>
        {listings.map((listing) => (
          <ListingCard
            key={listing.id}
            listingId={listing.id}
            imagePath={listing.photo}
            title={listing.title}
            subtitle={getListingLocation(listing)}
            price={listing.price}
            userId={userId}
            pathName="/search"
            favoriteId={listing.favorites[0]?.id}
            isInFavoriteList={!!listing.favorites[0]?.id}
          />
        ))}
      </ListingGrid>
    </>
  );
}

export default async function SearchPage({ searchParams }: { searchParams?: Promise<SearchParams> }) {
  const userProfile = await getClientUserProfile();
  const params = (await searchParams) || {};

  return (
    <>
      <MapFilterItems />
      <div className="page-container">
        <div className="pb-2 pt-8 sm:pt-10">
          <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">Search results</h1>
        </div>
        <Suspense key={JSON.stringify(params)} fallback={<ListingGridSkeleton />}>
          <ShowSearchResults searchParams={params} userId={userProfile?.id} />
        </Suspense>
      </div>
    </>
  );
}

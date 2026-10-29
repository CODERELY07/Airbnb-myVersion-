import { Suspense } from "react";
import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { CategoryBar } from "./components/CategoryBar";
import { ListingCard } from "./components/ListingCard";
import { ListingGrid, ListingGridSkeleton } from "./components/ListingGrid";
import { EmptyState } from "./components/EmptyState";
import { getCategory } from "./lib/categoryItems";
import { getListingLocation } from "./lib/locationHelpers";

async function ShowListings({ filter, userId }: { filter?: string; userId?: string }) {
  const listings = await serverCaller.listings.fetchListings({ searchParams: filter });

  if (!listings?.length) {
    return (
      <EmptyState
        title="No stays in this category yet"
        description="Try another category, or browse everything."
        action={{ href: "/", label: "Show all stays" }}
      />
    );
  }

  return (
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
          pathName="/"
          favoriteId={listing.favorites[0]?.id}
          isInFavoriteList={!!listing.favorites[0]?.id}
        />
      ))}
    </ListingGrid>
  );
}

export default async function Home({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const userProfile = await getClientUserProfile();
  const { filter } = await searchParams;
  const category = getCategory(filter);

  return (
    <>
      <CategoryBar />
      <div className="page-container">
        <div className="pb-6 pt-8 sm:pt-10">
          <h1 className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
            {category ? category.title : "Stays across the Philippines"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {category ? category.description : "From island huts to mountain cabins, hosted by locals."}
          </p>
        </div>
        <Suspense key={filter} fallback={<ListingGridSkeleton />}>
          <ShowListings filter={filter} userId={userProfile?.id} />
        </Suspense>
      </div>
    </>
  );
}

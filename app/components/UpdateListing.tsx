'use client'

import { NoListings } from "./NoListings";
import { UpdateListingCard } from "./UpdateListingCard";

interface Listing {
  id: string;
  photo: string | null;
  price: number | null;
  description: string | null;
  country: string | null;
  title: string | null;
  favorites: Array<{ id: string }>;
}

interface ListingGridProps {
  listings: Listing[];
  userId: string;
}

export function UpdateListing({ listings, userId }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <NoListings
        description="Please list your listings on airbnb so that you can see it right here"
        title="You don't have any listings listed"
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-8 mt-8">
      {listings.map((listing) => (
        <UpdateListingCard
          key={listing.id}
          imagePath={listing.photo as string}
          listingId={listing.id}
          price={listing.price as number}
          description={listing.description as string}
          location={listing.country as string}
          userId={userId}
          pathName="/my-homes"
          title={listing.title as string}
          favoriteId={listing.favorites[0]?.id}
          isInFavoriteList={listing.favorites.length > 0}
          showActions={true} 
        />
      ))}
    </div>
  );
}
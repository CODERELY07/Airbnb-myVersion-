import { MapFilterItems } from '../components/MapFilterItems';
import { ListingCard } from '../components/ListingCard';
import { Suspense } from 'react';
import { serverCaller } from '@/trpc/server';
import { SkeletonCard } from '../components/SkeletonCard';
import { NoListings } from '../components/NoListings';
import { getClientUserProfile } from '@/lib/supabase/auth';

interface SearchParams {
  destination?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: string;
  bedrooms?: string;
  bathrooms?: string;
  filter?: string;
}

async function ShowSearchResults({ 
  searchParams, 
  userId 
}: { 
  searchParams: SearchParams; 
  userId?: string 
}) {
  const listings = await serverCaller.listings.searchListings({
    destination: searchParams.destination,
    checkIn: searchParams.checkIn,
    checkOut: searchParams.checkOut,
    guests: searchParams.guests ? parseInt(searchParams.guests) : undefined,
    bedrooms: searchParams.bedrooms ? parseInt(searchParams.bedrooms) : undefined,
    bathrooms: searchParams.bathrooms ? parseInt(searchParams.bathrooms) : undefined,
    filter: searchParams.filter,
  });

  // console.log(listings);

  if (!listings?.length) {
    return (
      <NoListings
        title="No listings found"
        description="Try adjusting your search criteria to find more results"
      />
    );
  }

  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          description={listing.description}
          imagePath={listing.photo}
          location={listing.country}
          price={listing.price}
          userId={userId}
          title={listing.title}
          pathName="/search"
          favoriteId={listing.favorites[0]?.id}
          isInFavoriteList={!!listing.favorites[0]?.id}
          listingId={listing.id}
        />
      ))}
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 gap-8 mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}


export default async function SearchPage({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const userProfile = await getClientUserProfile();
  const params = await searchParams || {};

  return (
    <div className="container mx-auto px-5 lg:px-10">
      <MapFilterItems />
      <Suspense 
        key={JSON.stringify(params)} 
        fallback={<SkeletonLoading />}
      >
        <ShowSearchResults searchParams={params} userId={userProfile?.id} />
      </Suspense>
    </div>
  );
}
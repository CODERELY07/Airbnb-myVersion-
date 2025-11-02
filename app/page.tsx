// Home page
import { MapFilterItems } from './components/MapFilterItems';
import { ListingCard } from './components/ListingCard';
import { Suspense } from 'react';
import { serverCaller } from '@/trpc/server';
import { SkeletonCard } from './components/SkeletonCard';
import { NoListings } from './components/NoListings';
import { getClientUserProfile } from '@/lib/supabase/auth';


async function ShowListings({ filter, userId }: { filter?: string; userId?: string }) {
  const listings = await serverCaller.listings.fetchListings({
    searchParams: filter,
    // userId,
  });

  if (!listings?.length) {
    return <NoListings           
      title="No Listings Available..."
      description="Please check other category!"
    />;
  }
 
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
      {listings.map((listing) => (
        <ListingCard
          key={listing.id}
          description={listing.description}
          imagePath={listing.photo}
          location={listing.country}
          price={listing.price}
          userId={userId}
          title={listing.title}
          pathName='/'
          favoriteId={listing.favorites[0]?.id}
          isInFavoriteList={listing.favorites.length > 0 ? true : false}
          listingId={listing.id}
        />
      ))}
    </div>
  );
}

function SkeletonLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const userProfile = await getClientUserProfile();

  const params = await searchParams;
  const filter = params?.filter;

  return (
    <div className="container mx-auto px-4 sm:px-5 lg:px-10">
      <MapFilterItems />
      <Suspense key={filter} fallback={<SkeletonLoading />}>
        <ShowListings filter={filter} userId={userProfile?.id} />
      </Suspense>
    </div>
  );
}
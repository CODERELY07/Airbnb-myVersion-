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
    userId,
  });

  if (!listings?.length) {
    return <NoListings />;
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

export default async function Home({
  searchParams,
}: {
  searchParams?: { filter?: string };
}) {
  const userProfile = await getClientUserProfile();

  const filter = searchParams?.filter;

  return (
    <div className="container mx-auto px-5 lg:px-10">
      <MapFilterItems />
      <Suspense key={filter} fallback={<SkeletonLoading />}>
        <ShowListings filter={filter} userId={userProfile?.id} />
      </Suspense>
    </div>
  );
}

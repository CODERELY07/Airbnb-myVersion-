
import { redirect } from "next/navigation";
import { ListingCard } from "../components/ListingCard";
import { NoListings } from "../components/NoListings";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { serverCaller } from "@/trpc/server";


export default async function MyHomes() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id;

  if (!userId) {
    return redirect("/");
  }
   const listings = await serverCaller.listings.fetchListings({});
   
  if (!listings?.length) {
    return <NoListings           
      title="You don't have Listings yet..."
      description="Please Create ...!"
    />;
  }
  return (
    <section className="container mx-auto px-5 lg:px-10 mt-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Listings</h2>

      {listings.length === 0 ? (
        <NoListings
          description="Please list your listings on airbnb so that you can see it right here"
          title="Your dont have any listings listed"
        />
      ) : (
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-8 mt-8">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              imagePath={listing.photo as string}
              listingId={listing.id}
              price={listing.price as number}
              description={listing.description as string}
              location={listing.country as string}
              userId={userId}
              pathName="/my-homes"
              favoriteId={listing.favorites[0]?.id}
              isInFavoriteList={listing.favorites[0]?.length > 0 ? true : false}
            />
          ))}
        </div>
      )}
    </section>
  );
}
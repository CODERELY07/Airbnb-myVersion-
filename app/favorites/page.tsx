
import { redirect } from "next/navigation";
import { ListingCard } from "../components/ListingCard";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { NoListings } from "../components/NoListings";
import { serverCaller } from "@/trpc/server";

export default async function FavoriteRoute() {
   const userProfile = await getClientUserProfile();
   const userId = userProfile?.id;

  if (!userId) return redirect("/");
   const favListings = await serverCaller.listings.fetchFavListings({userId});

   console.log(favListings);
    if (!favListings?.length) {
        return <NoListings  title="Hey you dont have any favorites"
          description="Please add favorites to see them right here..."/>;
    }
  return (
    <section className="container mx-atuo px-5 lg:px-10 mt-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Favorites</h2>

      {favListings.length === 0 ? (
        <NoListings
          title="Hey you dont have any favorites"
          description="Please add favorites to see them right here..."
        />
      ) : (
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-8 mt-8">
          {favListings.map((favListing) => (
            <ListingCard
               key={favListing.listings.id}
                description={favListing.listings.description}
                imagePath={favListing.listings.photo}
                location={favListing.listings.country}
                price={favListing.listings.price}
                userId={userId}
                pathName='/'
                favoriteId={favListing.id}
                isInFavoriteList={true}
                listingId={favListing.listings.id}
            />
          ))}
        </div>
      )}
    </section>
  );
}
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";
import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { ListingCard } from "../components/ListingCard";
import { ListingGrid } from "../components/ListingGrid";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";
import { getListingLocation } from "../lib/locationHelpers";

export default async function FavoriteRoute() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id;
  if (!userId) return redirect("/");

  // skip favorites whose listing was deleted
  const favorites = ((await serverCaller.listings.fetchFavListings({ userId })) ?? []).filter((f) => f.listings);

  return (
    <div className="page-container">
      <PageHeader title="Favorites" description="Stays you've saved. Tap the heart again to remove one." />

      {favorites.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="No favorites yet"
          description="Tap the heart on any stay to save it here."
          action={{ href: "/", label: "Explore stays" }}
        />
      ) : (
        <ListingGrid>
          {favorites.map((favorite) => (
            <ListingCard
              key={favorite.id}
              listingId={favorite.listings.id}
              imagePath={favorite.listings.photo}
              title={favorite.listings.title}
              subtitle={getListingLocation(favorite.listings)}
              price={favorite.listings.price}
              userId={userId}
              pathName="/favorites"
              favoriteId={favorite.id}
              isInFavoriteList
            />
          ))}
        </ListingGrid>
      )}
    </div>
  );
}

import { addToFavorite, deleteFromFavorite } from "@/lib/supabase/listings";
import { ListingCardShell } from "./ListingCardShell";
import { FavoriteButton } from "./SubmitButtons";

interface ListingProps {
  listingId: string;
  imagePath: string;
  title: string;
  subtitle?: string;
  price: number;
  userId?: string;
  favoriteId?: string;
  isInFavoriteList?: boolean;
  pathName: string;
  showFavorite?: boolean;
}

export function ListingCard({
  listingId,
  imagePath,
  title,
  subtitle,
  price,
  userId,
  favoriteId,
  isInFavoriteList = false,
  pathName,
  showFavorite = true,
}: ListingProps) {
  // Heart only for logged-in users
  const favorite = userId && showFavorite && (
    <form action={isInFavoriteList ? deleteFromFavorite : addToFavorite}>
      {isInFavoriteList ? (
        <input type="hidden" name="favoriteId" value={favoriteId} />
      ) : (
        <>
          <input type="hidden" name="listingId" value={listingId} />
          <input type="hidden" name="userId" value={userId} />
        </>
      )}
      <input type="hidden" name="pathName" value={pathName} />
      <FavoriteButton active={isInFavoriteList} />
    </form>
  );

  return (
    <ListingCardShell
      listingId={listingId}
      imagePath={imagePath}
      title={title}
      subtitle={subtitle}
      price={price}
      action={favorite || undefined}
    />
  );
}

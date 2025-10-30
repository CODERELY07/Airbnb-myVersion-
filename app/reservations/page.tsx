import { getReservationListings } from "@/lib/supabase/listings";
import { ListingCard } from "../components/ListingCard";
import { NoListings } from "../components/NoListings";
import { getClientUserProfile } from "@/lib/supabase/auth";

export default async function Reservation() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id as string;

  const reservations = await getReservationListings(userId);

  return (
    <section className="container mx-auto px-5 lg:px-10 mt-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Reservations</h2>

      {reservations?.length === 0 ? (
        <NoListings
          title="No reservations found"
          description="You haven't made any reservations yet."
        />
      ) : (
        <div className="grid lg:grid-cols-4 sm:grid-cols-2 md:grid-cols-3 grid-cols-1 gap-8 mt-8">
          {reservations?.map((reservation) => (
            <ListingCard
              key={reservation.id}
              description={reservation.listings?.description ?? ""}
              imagePath={reservation.listings?.photo ?? ""}
              location={reservation.listings?.country ?? ""}
              price={reservation.listings?.price ?? 0}
              userId={userId}
              pathName="/"
              title={reservation.title}
              favoriteId={reservation.id}
              isInFavoriteList={true}
              listingId={reservation.listings?.id ?? ""}
            />
          ))}
        </div>
      )}
    </section>
  );
}

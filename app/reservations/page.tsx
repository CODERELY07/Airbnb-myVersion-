import { getReservationListings } from "@/lib/supabase/listings";
import { ListingCard } from "../components/ListingCard";
import { NoListings } from "../components/NoListings";
import { getClientUserProfile } from "@/lib/supabase/auth";

export default async function Reservation() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id as string;

  const reservations = await getReservationListings(userId);

  return (
    <section className="container mx-auto pb-10 px-5 lg:px-10 mt-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Reservations</h2>

      {reservations?.length === 0 ? (
        <NoListings
          title="No reservations found"
          description="You haven't made any reservations yet."
        />
      ) : (
          <div className="grid grid-cols-2  sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6 lg:gap-8 mt-6 sm:mt-8">
          {reservations?.map((reservation) => (
            <ListingCard
              key={reservation.id}
              description={reservation.listings?.description ?? ""}
              imagePath={reservation.listings?.photo ?? ""}
              location={reservation.listings?.country ?? ""}
              price={reservation.listings?.price ?? 0}
              userId={userId}
              pathName="/"
              title={reservation.listings.title}
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

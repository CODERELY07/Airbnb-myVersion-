import { redirect } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { getReservationListings } from "@/lib/supabase/listings";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { ListingCard } from "../components/ListingCard";
import { ListingGrid } from "../components/ListingGrid";
import { NoListings } from "../components/NoListings";
import { PageHeader } from "../components/PageHeader";

const shortDate: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };

export default async function Reservation() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id;
  if (!userId) return redirect("/");

  // skip reservations whose listing was deleted
  const reservations = ((await getReservationListings(userId)) ?? []).filter((r) => r.listings);

  return (
    <div className="page-container">
      <PageHeader title="Reservations" description="Your confirmed, paid stays." />

      {reservations.length === 0 ? (
        <NoListings
          icon={CalendarCheck}
          title="No reservations yet"
          description="When you book and pay for a stay, it shows up here."
          action={{ href: "/", label: "Find a stay" }}
        />
      ) : (
        <ListingGrid>
          {reservations.map((reservation) => (
            <ListingCard
              key={reservation.id}
              listingId={reservation.listings.id}
              imagePath={reservation.listings.photo}
              title={reservation.listings.title}
              subtitle={`${new Date(reservation.startDate).toLocaleDateString("en-US", shortDate)} – ${new Date(
                reservation.endDate
              ).toLocaleDateString("en-US", shortDate)}`}
              price={reservation.listings.price}
              pathName="/reservations"
              showFavorite={false}
            />
          ))}
        </ListingGrid>
      )}
    </div>
  );
}

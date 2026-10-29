import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { Avatar } from "../components/Avatar";
import { EmptyState } from "../components/EmptyState";
import { PageHeader } from "../components/PageHeader";

const day: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric", timeZone: "Asia/Manila" };
const formatDay = (value: string) => new Date(value).toLocaleDateString("en-US", day);

// Hosts: paid bookings of your listings, upcoming first
export default async function BookingsPage() {
  const user = await getClientUserProfile();
  if (!user) return redirect("/");

  const bookings = await serverCaller.listings.getHostBookings();
  const now = Date.now();
  const upcoming = bookings.filter((b) => Date.parse(b.endDate) > now);
  const past = bookings.filter((b) => Date.parse(b.endDate) <= now).reverse();
  const earnings = bookings.reduce((sum, b) => sum + Number(b.totalPrice ?? 0), 0);

  return (
    <div className="page-container max-w-5xl">
      <PageHeader title="Guest bookings" description="Paid bookings of the homes you host.">
        {bookings.length > 0 && (
          <div className="rounded-xl border bg-card px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total booked</p>
            <p className="font-display text-xl font-medium">{formatPrice(earnings)}</p>
          </div>
        )}
      </PageHeader>

      {bookings.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="No bookings yet"
          description="When a guest books and pays for one of your homes, it shows up here."
        />
      ) : (
        <div className="space-y-10">
          <BookingList title="Upcoming" bookings={upcoming} />
          <BookingList title="Past" bookings={past} />
        </div>
      )}
    </div>
  );
}

type Booking = Awaited<ReturnType<typeof serverCaller.listings.getHostBookings>>[number];

function BookingList({ title, bookings }: { title: string; bookings: Booking[] }) {
  if (bookings.length === 0) return null;

  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title} · {bookings.length}
      </h2>
      <ul className="divide-y rounded-2xl border bg-card">
        {bookings.map((b) => {
          // Supabase types embedded rows as arrays; at runtime these are single objects
          const listing = (Array.isArray(b.listings) ? b.listings[0] : b.listings) as { id: string; title: string; photo: string };
          const guest = (Array.isArray(b.users) ? b.users[0] : b.users) as { full_name?: string; avatar_url?: string } | null;

          return (
            <li key={b.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link href={`/listings/${listing.id}`} className="flex min-w-0 flex-1 items-center gap-4">
                <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
                  <Image src={getImageUrl(listing.photo)} alt="" fill sizes="64px" className="object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{listing.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDay(b.startDate)} – {formatDay(b.endDate)} · {b.nights} night{b.nights === 1 ? "" : "s"}
                  </p>
                </div>
              </Link>

              <div className="flex items-center justify-between gap-6 sm:justify-end">
                <div className="flex items-center gap-2">
                  <Avatar src={guest?.avatar_url} name={guest?.full_name} className="size-8" />
                  <span className="text-sm">{guest?.full_name ?? "Guest"}</span>
                </div>
                <span className="w-24 text-right font-semibold">{formatPrice(b.totalPrice)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

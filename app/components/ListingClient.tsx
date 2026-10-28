"use client";

import { useState } from "react";
import Image from "next/image";
import { Bath, BedDouble, MapPin, Users } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { trpc } from "@/trpc/client";
import { formatPrice, getImageUrl } from "@/lib/utils";
import { getCategory } from "../lib/categoryItems";
import { Avatar } from "./Avatar";
import ReservationCard from "./ReservationCard";
import { StayCalendar } from "./StayCalendar";

interface Address {
  region: string;
  province: string;
  city: string;
  barangay: string;
}

interface ListingClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listingData: any;
  userData: { full_name?: string | null; avatar_url?: string | null } | null;
  client: { id: string | null } | null;
  address: Address | null;
  paymentsEnabled: boolean;
}

export default function ListingClient({ listingData, userData, client, address, paymentsEnabled }: ListingClientProps) {
  const [dateRange, setDateRange] = useState<DateRange>({ from: undefined, to: undefined });

  // Already booked dates for this listing (dates only, no guest info)
  const { data: reservations = [], isLoading, error } = trpc.listings.fetchReservation.useQuery({
    listingId: listingData.id,
  });
  // Booked nights. The checkout day stays free so the next guest can check in that day.
  const booked = reservations.map((r) => ({
    from: new Date(r.startDate),
    to: new Date(new Date(r.endDate).getTime() - 24 * 60 * 60 * 1000),
  }));

  const category = getCategory(listingData.categoryName);
  const CategoryIcon = category?.icon;
  const hostSince = new Date(listingData.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const facts = [
    { icon: Users, label: `${listingData.guests} guest${listingData.guests === 1 ? "" : "s"}` },
    { icon: BedDouble, label: `${listingData.bedrooms} bedroom${listingData.bedrooms === 1 ? "" : "s"}` },
    { icon: Bath, label: `${listingData.bathrooms} bath${listingData.bathrooms === 1 ? "" : "s"}` },
  ];

  const addressRows = address
    ? [
        { label: "Barangay", value: address.barangay },
        { label: "City / Municipality", value: address.city },
        { label: "Province", value: address.province },
        { label: "Region", value: address.region },
      ]
    : [];

  return (
    <article className="page-container max-w-[1200px] pt-6 sm:pt-10">
      {/* Title */}
      <header className="mb-5 sm:mb-6">
        <h1 className="font-display text-3xl font-medium leading-tight tracking-tight sm:text-4xl">{listingData.title}</h1>
        {address && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" />
            {address.city}, {address.province}
          </p>
        )}
      </header>

      {/* Photo */}
      <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted ring-1 ring-black/5 sm:aspect-[16/9] lg:aspect-[2/1]">
        <Image
          src={getImageUrl(listingData.photo)}
          alt={listingData.title}
          fill
          priority
          sizes="(min-width: 1200px) 1120px, 100vw"
          className="object-cover"
        />
      </div>

      <div className="mt-8 grid gap-10 lg:mt-12 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16">
        {/* Details */}
        <div className="min-w-0 divide-y">
          <section className="pb-8">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-[15px]">
              {facts.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <Icon className="size-[18px] text-muted-foreground" strokeWidth={1.75} />
                  {label}
                </li>
              ))}
            </ul>

            <div className="mt-6 flex items-center gap-3">
              <Avatar src={userData?.avatar_url} name={userData?.full_name} className="size-11" />
              <div>
                <p className="font-medium">Hosted by {userData?.full_name ?? "a local host"}</p>
                <p className="text-sm text-muted-foreground">Hosting since {hostSince}</p>
              </div>
            </div>
          </section>

          {category && CategoryIcon && (
            <section className="flex items-start gap-4 py-8">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted">
                <CategoryIcon className="size-5" strokeWidth={1.75} />
              </span>
              <div>
                <h2 className="font-medium">{category.title}</h2>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </div>
            </section>
          )}

          <section className="py-8">
            <h2 className="font-display text-xl font-medium">About this place</h2>
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted-foreground">
              {listingData.description}
            </p>
          </section>

          <section className="py-8">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading availability…</p>
            ) : error ? (
              <p className="text-sm text-destructive">Couldn&apos;t load availability. Please refresh the page.</p>
            ) : (
              <StayCalendar dateRange={dateRange} setDateRange={setDateRange} booked={booked} />
            )}
          </section>

          {addressRows.length > 0 && (
            <section className="py-8">
              <h2 className="font-display text-xl font-medium">Where you&apos;ll be</h2>
              <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                {addressRows.map((row) => (
                  <div key={row.label}>
                    <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{row.label}</dt>
                    <dd className="mt-0.5 text-[15px]">{row.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}
        </div>

        {/* Booking */}
        <aside id="book" className="scroll-mt-40 lg:sticky lg:top-28 lg:self-start">
          <ReservationCard
            userId={client?.id ?? ""}
            checkIn={dateRange.from}
            checkOut={dateRange.to}
            listingPrice={Number(listingData.price)}
            listingId={listingData.id}
            paymentsEnabled={paymentsEnabled}
            isOwner={!!client?.id && client.id === listingData.userId}
          />
        </aside>
      </div>

      {/* Phones / tablets: price always in reach, jumps to the booking card */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t bg-card lg:hidden">
        <div className="page-container flex h-20 items-center justify-between">
          <p>
            <span className="font-display text-lg font-medium">{formatPrice(listingData.price)}</span>
            <span className="text-sm text-muted-foreground"> / night</span>
          </p>
          <a
            href="#book"
            className="rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          >
            Check dates
          </a>
        </div>
      </div>
    </article>
  );
}

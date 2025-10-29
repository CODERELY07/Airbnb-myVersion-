'use client';

import { useState } from 'react';
import Image from 'next/image';
import { DateRange } from 'react-day-picker';
import { NoListings } from '@/app/components/NoListings';
import { Separator } from '@/components/ui/separator';
import { CategoryShowcase } from '@/app/components/CategoryShowcase';
import { HomeMap } from '@/app/components/HomeMap';
import CalendarReservation from '@/components/CalendarReservation';
import ReservationCard from '@/app/components/ReservationCard';
import { createReservation } from '@/lib/supabase/listings';

export default function ListingClient({ listingData, userData, client }: any) {
  if (!listingData) return <NoListings />;

  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  return (
    <div className="w-[75%] mx-auto mt-10 mb-12">
      <h1 className="font-medium text-2xl mb-5">{listingData?.title}</h1>
      <div className="relative h-[550px]">
        <Image
          alt="Image of Home"
          src={`https://jdhqxdkqnhfartemppiq.supabase.co/storage/v1/object/public/images/${listingData?.photo}`}
          fill
          className="rounded-lg h-full object-cover w-full"
        />
      </div>

      <div className="flex justify-between gap-x-24 mt-8">
        <div className="w-2/3">
          <h3 className="text-xl font-medium">
            {listingData.country?.flag} {listingData.country?.label} /{' '}
            {listingData.country?.region}
          </h3>

          <div className="flex gap-x-2 text-muted-foreground">
            <p>{listingData?.guests} Guests</p> * <p>{listingData?.bedrooms} Bedrooms</p> *{' '}
            {listingData?.bathrooms} Bathrooms
          </div>

          <div className="flex items-center mt-6">
            <img
              src={
                userData?.avatar_url ??
                'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg'
              }
              alt="User Profile"
              className="w-11 h-11 rounded-full"
            />
            <div className="flex flex-col ml-4">
              <h3 className="font-medium">Hosted by {userData?.full_name}</h3>
              <p className="text-sm text-muted-foreground">
                Host since{' '}
                {new Date(listingData?.created_at).toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>

          <Separator className="my-7" />
          <CategoryShowcase categoryName={listingData?.categoryName as string} />
          <Separator className="my-7" />
          <p className="text-muted-foreground">{listingData?.description}</p>
          <Separator className="my-7" />

          <div className="w-2/3">
            <CalendarReservation dateRange={dateRange} listingId={listingData.id} setDateRange={setDateRange} />
            <HomeMap locationValue={listingData?.country?.value as string} />
          </div>
        </div>

        <form action={createReservation} className="relative">
          <input type="hidden" name="listingId" value={listingData.id} />
          <input type="hidden" name="userId" value={client?.id} />

          <ReservationCard
            userId={client?.id}
            checkIn={dateRange.from}
            checkOut={dateRange.to}
            listingPrice ={listingData?.price}
          />
        </form>
      </div>
    </div>
  );
}

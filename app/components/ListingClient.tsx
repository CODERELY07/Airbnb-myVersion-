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
import { getBarangayName, getMunicipalityName, getProvinceName, getRegionName } from '../lib/locaitonHelpers';


export default function ListingClient({ listingData, userData, client }: any) {
  if (!listingData) return <NoListings />;

  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });

  const regionName = getRegionName(listingData.region);
  const provinceName = getProvinceName(listingData.region, listingData.provinceCode);
  const cityName = getMunicipalityName(listingData.provinceCode, listingData.munCityCode);
  const barangayName = getBarangayName(listingData.munCityCode, listingData.barangayCode);


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
            {listingData.title}
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
            <div className="-ml-10">
            <h2 className="text-2xl font-semibold mb-6">Address Details</h2>
            <div className="space-y-1">
              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Region</p>
                  <p className="text-base text-gray-900">{regionName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Province</p>
                  <p className="text-base text-gray-900">{provinceName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">City / Municipality</p>
                  <p className="text-base text-gray-900">{cityName}</p>
                </div>
              </div>

              <div className="flex items-start space-x-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 font-medium mb-1">Barangay</p>
                  <p className="text-base text-gray-900">{barangayName}</p>
                </div>
              </div>
            </div>
          </div>
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

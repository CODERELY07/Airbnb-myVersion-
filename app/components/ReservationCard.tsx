'use client';
import React, { useMemo } from 'react';
import { ReservationSubmitButton } from './SubmitButtons';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReservationCard({
  userId,
  checkIn,
  checkOut,
  listingPrice,
}: {
  userId: string;
  checkIn?: Date;
  checkOut?: Date;
  listingPrice: number;
}) {
  const { nights, totalPrice } = useMemo(() => {
    if (!checkIn || !checkOut) return { nights: 0, totalPrice: 0 };
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { nights: diffDays, totalPrice: diffDays * listingPrice };
  }, [checkIn, checkOut, listingPrice]);

  return (
    <div className="min-h-screen sticky top-30 p-4 sm:p-8 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-200">
        <div className="mb-6 w-60">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-3xl sm:text-4xl font-semibold">
              ₱{listingPrice.toLocaleString()}
            </span>
            <span className="text-gray-600 text-base sm:text-lg">per night</span>
          </div>

          {nights > 0 && (
            <p className="text-gray-600 text-sm mt-1">
              ₱{totalPrice.toLocaleString()} total for {nights} night
              {nights !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="border border-gray-300 rounded-xl overflow-hidden mb-4">
          <div className="grid grid-cols-2 border-b border-gray-300">
            <button className="p-4 text-left hover:bg-gray-50 transition border-r border-gray-300">
              <div className="text-xs font-semibold mb-1">CHECK-IN</div>
              <div className="text-sm sm:text-base font-medium">
                {checkIn ? checkIn.toLocaleDateString('en-US') : 'Select date'}
              </div>
              {checkIn && (
                <input
                  type="hidden"
                  name="startDate"
                  value={checkIn.toISOString()}   
                />
              )}
            </button>
            <button className="p-4 text-left hover:bg-gray-50 transition">
              <div className="text-xs font-semibold mb-1">CHECKOUT</div>
              <div className="text-sm sm:text-base font-medium">
                {checkOut ? checkOut.toLocaleDateString('en-US') : 'Select date'}
              </div>
              {checkOut && (
                <input
                  type="hidden"
                  name="endDate"
                  value={checkOut.toISOString()}
                />
              )}
            </button>
          </div>
        </div>

        {userId ? (
          <ReservationSubmitButton />
        ) : (
          <Button className="w-full" asChild>
            <Link href="/api/auth/login">Make a Reservation</Link>
          </Button>
        )}

        <p className="text-center text-gray-600 text-sm mt-3">
          You won't be charged yet
        </p>
      </div>
    </div>
  );
}

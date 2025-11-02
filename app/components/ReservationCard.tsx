'use client';
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ReservationCard({
  userId,
  checkIn,
  checkOut,
  listingPrice,
  listingId,
}: {
  userId: string;
  checkIn?: Date;
  checkOut?: Date;
  listingPrice: number;
  listingId: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { nights, totalPrice } = useMemo(() => {
    if (!checkIn || !checkOut) return { nights: 0, totalPrice: 0 };
    const diffTime = checkOut.getTime() - checkIn.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return { nights: diffDays, totalPrice: diffDays * listingPrice };
  }, [checkIn, checkOut, listingPrice]);

  const handlePayment = async () => {
    if (!checkIn || !checkOut || nights <= 0) {
      setError('Please select valid check-in and check-out dates');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const amountInCentavos = Math.round(totalPrice * 100);

      // console.log('Initiating payment for:', amountInCentavos, 'centavos');

      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountInCentavos,
          listingId,
          userId,
          checkIn: checkIn.toISOString(),
          checkOut: checkOut.toISOString(),
          nights,
          totalPrice,
        }),
      });

      const data = await res.json();

      console.log('API Response:', data);

      if (!res.ok || data.error) {
        const errorMessage = Array.isArray(data.error)
          ? data.error.map((e: any) => e.detail).join(', ')
          : data.message || 'You already have a reservation for this listing. Please check your reservations.';
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      const checkoutUrl = data?.data?.attributes?.redirect?.checkout_url;

      if (!checkoutUrl) {
      // console.error('Missing checkout URL in response:', data);
        setError('Could not get payment URL. Please try again.');
        setLoading(false);
        return;
      }

      // console.log('Redirecting to:', checkoutUrl);
      
      // Redirect to GCash payment page
      window.location.href = checkoutUrl;
      
    } catch (err) {
      console.error('Payment error:', err);
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-[350px] lg:sticky lg:top-4 p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-start">
      <div className="w-full max-w-md lg:max-w-xl bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-200">
        <div className="mb-4 sm:mb-6">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
              ₱{listingPrice.toLocaleString()}
            </span>
            <span className="text-gray-600 text-sm sm:text-base lg:text-lg">per night</span>
          </div>

          {nights > 0 && (
            <p className="text-gray-600 text-xs sm:text-sm mt-1">
              ₱{totalPrice.toLocaleString()} total for {nights} night
              {nights !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="border border-gray-300 rounded-lg sm:rounded-xl overflow-hidden mb-3 sm:mb-4">
          <div className="grid grid-cols-2 border-b border-gray-300">
            <div className="p-3 sm:p-4 text-left border-r border-gray-300">
              <div className="text-xs font-semibold mb-1">CHECK-IN</div>
              <div className="text-xs sm:text-sm lg:text-base font-medium">
                {checkIn ? checkIn.toLocaleDateString('en-US') : 'Select date'}
              </div>
            </div>
            <div className="p-3 sm:p-4 text-left">
              <div className="text-xs font-semibold mb-1">CHECKOUT</div>
              <div className="text-xs sm:text-sm lg:text-base font-medium">
                {checkOut ? checkOut.toLocaleDateString('en-US') : 'Select date'}
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
            <p className="text-xs sm:text-sm text-red-600">{error}</p>
          </div>
        )}

        {userId ? (
          <Button
            className="w-full text-sm sm:text-base py-5 sm:py-6"
            onClick={handlePayment}
            disabled={loading || !checkIn || !checkOut || nights <= 0}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </span>
            ) : (
              `Reserve`
            )}
          </Button>
        ) : (
          <Button className="w-full text-sm sm:text-base py-5 sm:py-6" asChild>
            <Link href="/">Login to Make a Reservation</Link>
          </Button>
        )}

        <p className="text-center text-gray-600 text-xs sm:text-sm mt-3">
          {userId ? "You'll be redirected to GCash to complete your Reservation" : "Please login to continue"}
        </p>
      </div>
    </div>
  );
}
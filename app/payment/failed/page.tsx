// app/payment/failed/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function PaymentFailed() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams.get('reservation_id');

  useEffect(() => {
    // Delete the unpaid reservation
    const deleteReservation = async () => {
      if (!reservationId) return;

      const supabase = await createClient();
      await supabase.from('reservations').delete().eq('id', reservationId);
    };

    deleteReservation();
  }, [reservationId]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-red-100 p-3">
            <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-center mb-2 text-red-600">Payment Failed</h1>
        <p className="text-center text-gray-600 mb-6">
          Your payment was not completed. No charges were made to your account.
        </p>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 mb-3"
        >
          Try Again
        </button>
        <button
          onClick={() => router.push('/')}
          className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-300"
        >
          Return Home
        </button>
      </div>
    </div>
  );
}
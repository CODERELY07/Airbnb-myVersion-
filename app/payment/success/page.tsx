// app/payment/success/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function PaymentSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const reservationId = searchParams.get('reservation_id');
  const verified = useRef(false);

  useEffect(() => {
    // run once (React dev mode runs effects twice)
    if (verified.current) return;
    verified.current = true;

    const updateReservation = async () => {
      if (!reservationId) {
        setStatus('error');
        return;
      }

      // Payment is verified on the server, the browser can't mark it paid
      const res = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservationId }),
      });

      if (!res.ok) {
        console.error('Error verifying payment:', await res.text());
        setStatus('error');
      } else {
        setStatus('success');
        setTimeout(() => {
          router.push('/reservations');
        }, 3000);
      }
    };

    updateReservation();
  }, [reservationId, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full border">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-4">
              <svg className="animate-spin h-12 w-12 text-blue-600" viewBox="0 0 24 24">
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
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">Processing Payment...</h1>
            <p className="text-center text-gray-600">Please wait while we confirm your payment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-green-100 p-3">
                <svg className="h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-green-600">Payment Successful!</h1>
            <p className="text-center text-gray-600 mb-4">
              Your reservation has been confirmed. You'll be redirected to your reservations page shortly.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="flex justify-center mb-4">
              <div className="rounded-full bg-red-100 p-3">
                <svg className="h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2 text-red-600">Something Went Wrong</h1>
            <p className="text-center text-gray-600 mb-4">
              There was an error processing your payment. Please contact support.
            </p>
            <Button
              onClick={() => router.push('/')}
              className="w-full text-white py-3 px-4 rounded-lg font-semibold"
            >
              Return Home
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
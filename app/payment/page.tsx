"use client";
import { useState } from "react";

export default function PayButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);

      const amountInCentavos = 100;

      console.log("Initiating payment for:", amountInCentavos, "centavos");

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountInCentavos }),
      });

      const data = await res.json();

      // console.log("API Response:", data);

      // Handle error response
      if (!res.ok || data.error) {
        const errorMessage = Array.isArray(data.error)
          ? data.error.map((e: any) => e.detail).join(", ")
          : "You already have a reservation for this listing. Please check your reservations.'";
        
        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Extract checkout URL
      const checkoutUrl = data?.data?.attributes?.redirect?.checkout_url;

      if (!checkoutUrl) {
        console.error("Missing checkout URL in response:", data);
        setError("Could not get payment URL. Please try again.");
        setLoading(false);
        return;
      }

      console.log("Redirecting to:", checkoutUrl);
      
      // Redirect to GCash payment page
      window.location.href = checkoutUrl;
      
    } catch (err) {
      console.error("Payment error:", err);
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-start min-h-screen p-4 pt-8">
      <div className="bg-card rounded-lg shadow-lg p-8 max-w-md w-full border">
        <h1 className="text-2xl font-bold text-foreground mb-4 text-center">
          GCash Payment
        </h1>
        
        <div className="bg-muted border border-border rounded p-4 mb-6">
          <p className="text-sm text-foreground">
            <strong>Amount:</strong> ₱1.00
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            You'll be redirected to GCash to complete your payment
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 border border-destructive/50 rounded p-3 mb-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
            loading
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
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
            "Pay ₱1 with GCash"
          )}
        </button>
      </div>
    </div>
  );
}
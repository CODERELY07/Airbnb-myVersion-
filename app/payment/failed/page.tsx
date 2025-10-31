export default function PaymentFailed() {
  return (
    <div className="flex items-start mt-8 justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-red-600">Payment Failed</h1>
        <p className="mt-4">Something went wrong. Please try again.</p>
      </div>
    </div>
  );
}
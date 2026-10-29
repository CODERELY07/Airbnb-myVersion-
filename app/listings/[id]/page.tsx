import { getListingData } from "@/lib/supabase/listings";
import { getClientUserProfile } from "@/lib/supabase/auth";
import { isPaymentEnabled } from "@/lib/utils";
import ListingClient from "@/app/components/ListingClient";
import { EmptyState } from "@/app/components/EmptyState";
import { getListingAddress } from "@/app/lib/locationHelpers";

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [data, userLogged] = await Promise.all([getListingData(id), getClientUserProfile()]);

  if (!data.listing) {
    return (
      <div className="page-container pt-12">
        <EmptyState
          title="This stay isn't available"
          description="It may have been removed by the host."
          action={{ href: "/", label: "Browse stays" }}
        />
      </div>
    );
  }

  return (
    <ListingClient
      listingData={data.listing}
      userData={data.user}
      client={userLogged}
      // Resolved here so the PSGC data never ships to the browser
      address={getListingAddress(data.listing)}
      paymentsEnabled={isPaymentEnabled()}
    />
  );
}

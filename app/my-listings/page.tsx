import { getClientUserProfile } from "@/lib/supabase/auth";
import { redirect } from "next/navigation";
import { serverCaller } from "@/trpc/server";
import { NoListings } from "../components/NoListings";
import { UpdateListing } from "../components/UpdateListing";



export default async function MyHomes() {
  const userProfile = await getClientUserProfile();
  const userId = userProfile?.id;

  if (!userId) {
    return redirect("/");
  }

  const listings = await serverCaller.listings.fetchListings({userId});
   
  if (!listings?.length) {
    return <NoListings           
      title="You don't have Listings yet..."
      description="Please Create ...!"
    />;
  }

  return (
    <section className="container mx-auto px-5 lg:px-10 mt-10">
      <h2 className="text-3xl font-semibold tracking-tight">Your Listings</h2>
      
      <UpdateListing listings={listings} userId={userId} />
    </section>
  );
}

import { getListingData } from '@/lib/supabase/listings';
import ListingClient from '@/app/components/ListingClient';
import { getClientUserProfile } from '@/lib/supabase/auth';

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listingId = params.id;
  const data = await getListingData(listingId);
  const userLogged = await getClientUserProfile();

  return <ListingClient listingData={data.listing} userData={data.user} client={userLogged}/>;
}

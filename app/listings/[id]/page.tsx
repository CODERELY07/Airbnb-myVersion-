import React from 'react'; 
import { getListingData } from '@/lib/supabase/listings';
import ListingClient from '@/app/components/ListingClient';
import { getClientUserProfile } from '@/lib/supabase/auth';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; 
  const data = await getListingData(id); 
  const userLogged = await getClientUserProfile();

  return <ListingClient listingData={data.listing} userData={data.user} client={userLogged}/>;
}
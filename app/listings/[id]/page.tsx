import React from 'react'; 
import { getListingData } from '@/lib/supabase/listings';
import ListingClient from '@/app/components/ListingClient';
import { getClientUserProfile } from '@/lib/supabase/auth';
import { isPaymentEnabled } from '@/lib/utils';

export default async function ListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; 
  const data = await getListingData(id); 
  const userLogged = await getClientUserProfile();

  // Hide online payment when PayMongo is not configured
  const paymentsEnabled = isPaymentEnabled();

  return <ListingClient listingData={data.listing} userData={data.user} client={userLogged} paymentsEnabled={paymentsEnabled}/>;
}
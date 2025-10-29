// 'use client'
// import { ReservationSubmitButton } from "@/app/components/SubmitButtons";
// import { useCountries } from "@/app/lib/getCountries";
// import { Button } from "@/components/ui/button";
// import Image from "next/image";
// import Link from "next/link";
// import { unstable_noStore as noStore } from "next/cache";
// import { getClientUserProfile } from "@/lib/supabase/auth";
// import { redirect } from "next/navigation";
// import { serverCaller } from "@/trpc/server";
// import { NoListings } from "@/app/components/NoListings";
// import { CategoryShowcase } from "@/app/components/CategoryShowcase";
// import { Separator } from "@/components/ui/separator";
// import { HomeMap } from "@/app/components/HomeMap";
// import CalendarReservation from "@/components/CalendarReservation";
// import ReservationCard from "@/app/components/ReservationCard";
// // import { useState } from 'react';
// import { DateRange } from 'react-day-picker';
// import { getListingData } from "@/lib/supabase/listings";


// export default async function ListingRoute({
//   params,
// }: {
//   params: { id: string };
// }) {
// //    const userProfile = await getClientUserProfile();
// //    const userId = userProfile?.id;
//    const listingId = await params.id;
    
// //    if (!userId) return redirect("/");

//     const data = await getListingData(listingId);
//     const userData = data.user;
//     const listingData = data.listing;

//     if (!listingData) {
//         return <NoListings />;
//     }

//     // const [dateRange, setDateRange] = useState<DateRange>({
//     //   from: new Date(2025, 9, 25), 
//     //   to: new Date(2025, 9, 26),
//     // },);
//     // const [dateRange, setDateRange] = null;
//     // const dataRange = new Date(2025, 9 ,25);
//   return (
//     <div className="w-[75%] mx-auto mt-10 mb-12">
//       <h1 className="font-medium text-2xl mb-5">{listingData?.title}</h1>
//       <div className="relative h-[550px]">
//         <Image
//           alt="Image of Home"
//           src={`https://jdhqxdkqnhfartemppiq.supabase.co/storage/v1/object/public/images/${listingData?.photo}`}
//           fill
//           className="rounded-lg h-full object-cover w-full"
//         />
//       </div>

//       <div className="flex justify-between gap-x-24 mt-8">
//         <div className="w-2/3">
//           <h3 className="text-xl font-medium">
//             {listingData.country?.flag} {listingData.country?.label} / {listingData.country?.region}
//           </h3>
//           <div className="flex gap-x-2 text-muted-foreground">
//             <p>{listingData?.guests} Guests</p> * <p>{listingData?.bedrooms} Bedrooms</p> *{" "}
//             {listingData?.bathrooms} Bathrooms
//           </div>

//           <div className="flex items-center mt-6">
//             <img
//               src={
//                 userData?.avatar_url ??
//                 "https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg"
//               }
//               alt="User Profile"
//               className="w-11 h-11 rounded-full"
//             />
//             <div className="flex flex-col ml-4">
//               <h3 className="font-medium">Hosted by {userData?.full_name}</h3>
//               <p className="text-sm text-muted-foreground">
//                 Host since {new Date(listingData?.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
//                 </p>

//             </div>
//           </div>

//           <Separator className="my-7" />

//           <CategoryShowcase categoryName={listingData?.categoryName as string} />

//           <Separator className="my-7" />

//           <p className="text-muted-foreground">{listingData?.description}</p>

//           <Separator className="my-7" />
//           <div className="w-2/3">
//             {/* Calendar receives date state from parent */}
//             <CalendarReservation dateRange={dateRange} setDateRange={setDateRange} />
//             <HomeMap locationValue={listingData?.country?.value as string} />
//           </div>

//         </div>
       
//          <form className="relative">
//           <input type="hidden" name="listingId" value={params.id} />
//           <input type="hidden" name="userId" value={userData?.id} />

//           {/* ReservationCard also gets dates from same state */}
//           <ReservationCard
//             userId={userData?.id}
//             checkIn={dateRange.from}
//             checkOut={dateRange.to}
//           />
//         </form>
//       </div>
//     </div>
//   );
// }
// /app/listings/[id]/page.tsx
import { getListingData } from '@/lib/supabase/listings';
import ListingClient from '@/app/components/ListingClient';
import { getClientUserProfile } from '@/lib/supabase/auth';

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listingId = params.id;
  const data = await getListingData(listingId);
  const userLogged = await getClientUserProfile();

  return <ListingClient listingData={data.listing} userData={data.user} client={userLogged}/>;
}

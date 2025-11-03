import Image from "next/image"
import Link from "next/link"
import { useCountries } from "../lib/getCountries"
import { Heart } from "lucide-react"
import { AddToFavoriteButton, DeleteFromFavoriteButton } from "./SubmitButtons"
import { addToFavorite, deleteFromFavorite } from "@/lib/supabase/listings"

interface ListingProps {
    imagePath: string,
    description: string,
    location: string,
    price: number,
    isInFavoriteList: boolean,
    favoriteId: string,
    listingId: string,
    userId: string | undefined,
    pathName: string,
    title: string
}

export function ListingCard({description, imagePath, location, price, userId, isInFavoriteList, favoriteId, listingId, pathName, title} : ListingProps){
    const {getCountryByValue} = useCountries();
    const country = getCountryByValue(location);
   
    return (
        <div className="flex flex-col group cursor-pointer max-w-[280px]">
            <Link href={`/listings/${listingId}`} className="mt-1 ml-0.5 block">
            <div className="relative aspect-square w-full overflow-hidden rounded-xl">
               <Image 
                    src={`https://jdhqxdkqnhfartemppiq.supabase.co/storage/v1/object/public/images/${imagePath}`} 
                    alt='Listings' 
                    fill 
                    sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 280px"
                    priority
                    className="rounded-xl object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {isInFavoriteList && (
                    <div className="absolute top-3 left-3 bg-white px-3 py-1.5 rounded-full shadow-sm z-10">
                        <p className="text-xs font-semibold text-gray-800">Guest favorite</p>
                    </div>
                )}


                {userId && (
                    <div className="z-20 absolute top-1 right-1">
                        {isInFavoriteList ? (
                            <form action={deleteFromFavorite}>
                                <input type="hidden" name="favoriteId" value={favoriteId}/>
                                <input type="hidden" name="pathName" value={pathName} />
                                <button type="submit" className="p-2 hover:scale-110 transition-transform">
                                    <Heart className="w-6 h-6 fill-red-500 text-red-500" />
                                </button>
                            </form>
                        ) : (
                            <form action={addToFavorite}>
                                <input type="hidden" name="listingId" value={listingId}/>
                                <input type="hidden" name="userId" value={userId}/>
                                <input type="hidden" name="pathName" value={pathName} />
                                <button type="submit"  className="p-2 hover:scale-110 transition-transform">
                                    <Heart className="w-6 h-6 fill-white/70 text-white stroke-white stroke-[1.5]" />
                                </button>
                            </form>
                        )}
                    </div>
                )}   
            </div>

           
                <h3 className="font-medium text-sm leading-snug text-black line-clamp-2">
                    {title}
                </h3>
                
                <p className="-mt-1 text-muted-foreground">
                    <span className="font-medium text-xs">₱{price.toLocaleString()}</span>
                    <span className="font-normal text-xs "> for 2 nights</span>
                </p>
            </Link>
        </div>
    )
}
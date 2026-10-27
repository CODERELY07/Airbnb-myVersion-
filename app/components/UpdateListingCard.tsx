'use client'
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteListing } from "@/lib/supabase/listings";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import Image from "next/image";
import { getImageUrl } from "@/lib/utils";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface ListingCardProps {
  imagePath: string;
  listingId: string;
  price: number;
  description: string;
  location: string;
  userId: string;
  pathName: string;
  title?: string;
  favoriteId?: string;
  isInFavoriteList?: boolean;
  showActions?: boolean; 
}

export function UpdateListingCard({
  imagePath,
  listingId,
  price,
  description,
  location,
  userId,
  pathName,
  title,
  favoriteId,
  isInFavoriteList,
  showActions = false,
}: ListingCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteListing(listingId);
      // The server action will handle the redirect and revalidation
    } catch (error) {
      console.error("Failed to delete listing:", error);
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
   <div className="flex flex-col group cursor-pointer max-w-[280px]">
      <Link href={`/listings/${listingId}`} className="mt-2">
       <div className="relative aspect-square w-full overflow-hidden rounded-xl">
        <Image 
          src={getImageUrl(imagePath)} 
          alt='Listings' 
          fill 
          className="rounded-lg h-full object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 280px"
        />

        {showActions && (
          <div className="absolute top-2 right-2 z-10">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8 bg-white/90 hover:bg-white"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link 
                    href={`/edit/${listingId}/structure`}
                    className="flex items-center cursor-pointer"
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Listing
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)}
                  className="text-red-600 focus:text-red-600 cursor-pointer"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Listing
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

   
        <h3 className="font-medium text-sm leading-snug text-black line-clamp-2">
          {title}
        </h3>
        
        <p className="-mt-1 text-muted-foreground">
            <span className="font-medium text-xs">₱{price.toLocaleString()}</span>
            <span className="font-normal text-xs "> per night</span>
        </p>
      </Link>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete
              your listing and remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
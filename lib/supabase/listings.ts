// app/actions/createCategoryAction.ts

"use server";

import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "./auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { safeFileName } from "@/lib/utils";
import { firstError, MAX_PHOTO_BYTES, parseListingDetails } from "@/lib/validation";


export async function createCategoryAction(prevState: any, formData: FormData) {
  const user = await getClientUserProfile();
  const userId = user?.id;
  const listingId = formData.get("listingId") as string;
  const categoryName = formData.get("categoryName") as string;

  if (!userId) {
    return { error: "You must be logged in" };
  }

  if (!categoryName) {
    return { error: "Please select a category" };
  }

    await serverCaller.createCategory.createCategory({
      userId,
      listingId,
      categoryName,
    });

    redirect(`/create/${listingId}/description`);
}

export async function createDescription(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const imageFile = formData.get("image") as File;
  const back = (error: string) => redirect(`/create/${listingId}/description?error=${encodeURIComponent(error)}`);

  if (!listingId) return redirect("/");

  // Same rules as the API: price, counts and text lengths
  const details = parseListingDetails(formData);
  if (!details.success) return back(firstError(details.error));

  if (!imageFile || imageFile.size === 0) return back("Please upload a photo.");
  if (!imageFile.type.startsWith("image/")) return back("The photo must be an image file.");
  if (imageFile.size > MAX_PHOTO_BYTES) return back("The photo must be smaller than 5 MB.");

  const supabase = await createClient();
  const filePath = `${listingId}/${Date.now()}-${safeFileName(imageFile.name)}`;

  const { data: imageData, error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, imageFile, { cacheControl: "2592000", contentType: imageFile.type });

  if (uploadError || !imageData?.path) {
    console.error("Upload error:", uploadError);
    return back("Failed to upload the photo. Please try again.");
  }

  try {
    await serverCaller.createListing.createDescription({ ...details.data, listingId, photo: imageData.path });
  } catch (err) {
    console.error("createDescription failed:", err);
    await supabase.storage.from("images").remove([imageData.path]);
    return back("Could not save your listing. Please try again.");
  }

  return redirect(`/create/${listingId}/address`);
}

export async function createLocation(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const regionCode = formData.get("regionCode") as string;
  const provinceCode = formData.get("provinceCode") as string;
  const munCityCode = formData.get("munCityCode") as string;
  const barangayCode = formData.get("barangayCode") as string;

  // Validate required fields
  if (!listingId) {
    return redirect(`/create?error=Missing listing ID`);
  }

  if (!regionCode) {
    return redirect(`/create/${listingId}/address?error=Please select a region`);
  }

  if (!provinceCode) {
    return redirect(`/create/${listingId}/address?error=Please select a province`);
  }

  if (!barangayCode) {
    return redirect(`/create/${listingId}/address?error=Please select a barangay`);
  }

  await serverCaller.createListing.createLocation({
    listingId,
    regionCode,
    provinceCode,
    munCityCode,
    barangayCode,
  });

  return redirect("/");
}
export async function addToFavorite(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const userId = formData.get("userId") as string;
  const pathName = formData.get("pathName") as string;


  if (!listingId || !userId || !pathName) {
    throw new Error("Missing required fields");
  }

 
  await serverCaller.listings.addToFavorite({
    listingId, userId, pathName
  })
 
}

export async function deleteFromFavorite(formData: FormData){
    const favoriteId = formData.get('favoriteId') as string;
    const pathName = formData.get('pathName') as string;
    if(!favoriteId){
      throw new Error(favoriteId);
    }

    await serverCaller.listings.removeFromFavorite({
      favoriteId, pathName
    })


}

export async function getListingData(listingId : string){
  const response = await serverCaller.listings.getListingData({listingId});
  // console.log(response)
  const listing = response?.listing;
  // console.log("listings", listingData)
  const user = response?.user;
  // console.log("fullname", userData.full_name)

  return {listing, user}

}
// Listing for the edit pages: only returns it if the logged-in user owns it
export async function getOwnListing(listingId: string){
  const user = await getClientUserProfile();
  const { listing } = await getListingData(listingId);

  if (!user || !listing || listing.userId !== user.id) return null;
  return listing;
}

export async function getReservationListings(userId: string){
  const reservations = await serverCaller.listings.getReservationListings({userId});
  return reservations;
}

// update
export async function updateListingDescription(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const imageFile = formData.get("image") as File;
  const back = (error: string) => redirect(`/edit/${listingId}/description?error=${encodeURIComponent(error)}`);

  if (!listingId) return redirect("/my-listings");

  const details = parseListingDetails(formData);
  if (!details.success) return back(firstError(details.error));

  const supabase = await createClient();
  let newPhoto: string | undefined;
  let oldPhoto: string | undefined;

  // Optional new photo: upload first, swap in the DB, and only then delete the old one,
  // so a failed upload never leaves the listing without a photo.
  if (imageFile && imageFile.size > 0) {
    if (!imageFile.type.startsWith("image/")) return back("The photo must be an image file.");
    if (imageFile.size > MAX_PHOTO_BYTES) return back("The photo must be smaller than 5 MB.");

    const { data: listing } = await supabase.from("listings").select("photo").eq("id", listingId).single();
    oldPhoto = listing?.photo ?? undefined;

    const filePath = `${listingId}/${Date.now()}-${safeFileName(imageFile.name)}`;
    const { data: imageData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, { cacheControl: "2592000", contentType: imageFile.type });

    if (uploadError || !imageData?.path) {
      console.error("Upload error:", uploadError);
      return back("Failed to upload the photo. Please try again.");
    }
    newPhoto = imageData.path;
  }

  try {
    await serverCaller.listings.updateListing({ listingId, ...details.data, ...(newPhoto && { photo: newPhoto }) });
  } catch (err) {
    console.error("updateListing failed:", err);
    if (newPhoto) await supabase.storage.from("images").remove([newPhoto]);
    return back("Could not save your changes. Please try again.");
  }

  if (newPhoto && oldPhoto && oldPhoto !== newPhoto) {
    await supabase.storage.from("images").remove([oldPhoto]);
  }

  redirect(`/edit/${listingId}/address`);
}

export async function updateListingLocation(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const regionCode = formData.get("regionCode") as string;
  const provinceCode = formData.get("provinceCode") as string;
  const munCityCode = formData.get("munCityCode") as string;
  const barangayCode = formData.get("barangayCode") as string;

if (!listingId || !regionCode || !provinceCode || !barangayCode) {
    throw new Error("Missing required fields");
  }

  await serverCaller.listings.updateLocation({
    listingId,
    regionCode,
    provinceCode,
    munCityCode,
    barangayCode,
  });

  return redirect("/my-listings");
}

export async function updateListingCategory(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const categoryName = formData.get("categoryName") as string;

  if (!listingId || !categoryName) {
    throw new Error("Missing required fields");
  }

  await serverCaller.listings.updateCategory({
    listingId,
    categoryName,
  });

  return redirect(`/edit/${listingId}/description`);
}

// Returns { error } when the listing can't be deleted (e.g. it has upcoming paid bookings)
export async function deleteListing(listingId: string): Promise<{ error?: string }> {
  const user = await getClientUserProfile();
  if (!user?.id || !listingId) return { error: "Please log in again." };

  try {
    await serverCaller.listings.deleteListing({ listingId, userId: user.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    // Show our own business messages; hide anything technical
    return { error: message.startsWith("This listing") ? message : "Could not delete this listing. Please try again." };
  }

  revalidatePath("/my-listings");
  return {};
}

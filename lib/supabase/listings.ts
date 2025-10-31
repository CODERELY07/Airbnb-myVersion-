// app/actions/createCategoryAction.ts

"use server";

import { serverCaller, trpc } from "@/trpc/server";
import { getClientUserProfile } from "./auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { AsyncCallbackSet } from "next/dist/server/lib/async-callback-set";
import { start } from "repl";
import { revalidatePath } from "next/cache";


export async function createCategoryAction(formData: FormData) {
  const user = await getClientUserProfile();
  const userId = user?.id;
  const listingId = formData.get("listingId") as string;
  const categoryName = formData.get("categoryName") as string;

  
  if (!userId || !listingId || !categoryName) {
    throw new Error("Missing required fields");
  }

  await serverCaller.createCategory.createCategory({
    userId,
    listingId,
    categoryName,
  });

  return redirect(`/create/${listingId}/description`);
}


export async function createDescription(formData: FormData){
  const listingId = formData.get("listingId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const imageFile = formData.get("image") as File;

  const guests = formData.get("guest") as string;
  const bedrooms = formData.get("bedroom") as string;
  const bathrooms = formData.get("bathroom") as string;

  if (!title || !description || !price || !imageFile || !listingId || !bathrooms || !guests || !bedrooms) {
    throw new Error("Missing required fields");
  }

  const supabase = await createClient();

  const filePath = `${imageFile.name}-${Date.now()}`;

  const { data: imageData, error: uploadError } = await supabase.storage
    .from("images")
    .upload(filePath, imageFile, {
      cacheControl: "2592000",
      contentType: imageFile.type,
    });

  if (uploadError) {
    throw new Error("Image upload failed");
  }

  const photoUrl = imageData?.path;


  await serverCaller.createListing.createDescription({
    title,
    description,
    price,
    listingId,
    bedrooms,
    bathrooms,
    guests,
    photo: photoUrl, 
  });

  return redirect(`/create/${listingId}/address`);
}


export async function createLocation(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const regionCode = formData.get("regionCode") as string;
  const provinceCode = formData.get("provinceCode") as string;
  const munCityCode = formData.get("munCityCode") as string;
  const barangayCode = formData.get("barangayCode") as string;

   if (!listingId || !regionCode || !provinceCode || !munCityCode || !barangayCode) {
    throw new Error("Missing required fields");
  }

  
  await serverCaller.createListing.createLocation({
    listingId,
    regionCode, 
    provinceCode,
    munCityCode,
    barangayCode
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

export async function createReservation(formData: FormData) {
  const userId = formData.get("userId") as string;
  const listingId = formData.get("listingId") as string;
  const startDate = formData.get("startDate") as string;
  const endDate = formData.get("endDate") as string;

  console.log("user data", userId, listingId, startDate, endDate)
    if (!listingId || !userId || !startDate || !endDate) {
    throw new Error("Missing required fields");
  }

  await serverCaller.listings.createReservation({
    userId, listingId, startDate, endDate
  })

  return redirect("/");
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
export async function getReservationListings(userId: string){
  const reservations = await serverCaller.listings.getReservationListings({userId});
  return reservations;
}

// update
export async function updateListingDescription(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;
  const imageFile = formData.get("image") as File;
  const guests = formData.get("guest") as string;
  const bedrooms = formData.get("bedroom") as string;
  const bathrooms = formData.get("bathroom") as string;

  if (!listingId || !title || !description || !price || !bathrooms || !guests || !bedrooms) {
    throw new Error("Missing required fields");
  }

  const supabase = await createClient();
  let photoUrl: string | undefined;

  // Only upload new image if provided
  if (imageFile && imageFile.size > 0) {
    // Get old photo to delete it
    const { data: listing } = await supabase
      .from("listings")
      .select("photo")
      .eq("id", listingId)
      .single();

    // Delete old image if exists
    if (listing?.photo) {
      await supabase.storage.from("images").remove([listing.photo]);
    }

    // Upload new image
    const filePath = `${imageFile.name}-${Date.now()}`;
    const { data: imageData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, {
        cacheControl: "2592000",
        contentType: imageFile.type,
      });

    if (uploadError) {
      throw new Error("Image upload failed");
    }

    photoUrl = imageData?.path;
  }

  await serverCaller.listings.updateListing({
    listingId,
    title,
    description,
    price,
    bedrooms,
    bathrooms,
    guests,
    ...(photoUrl && { photo: photoUrl }),
  });

  redirect(`/edit/${listingId}/address`);
}

export async function updateListingLocation(formData: FormData) {
  const listingId = formData.get("listingId") as string;
  const regionCode = formData.get("regionCode") as string;
  const provinceCode = formData.get("provinceCode") as string;
  const munCityCode = formData.get("munCityCode") as string;
  const barangayCode = formData.get("barangayCode") as string;

  if (!listingId || !regionCode || !provinceCode || !munCityCode || !barangayCode) {
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

// TODO:: DOne delete finish CRUD then test
export async function deleteListing(listingId: string) {
  const user = await getClientUserProfile();
  const userId = user?.id;

  if (!userId || !listingId) {
    throw new Error("Missing required fields");
  }

  await serverCaller.listings.deleteListing({
    listingId,
    userId,
  });

  revalidatePath("/my-listings");
  redirect("/my-listings");
}
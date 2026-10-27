// app/actions/createCategoryAction.ts

"use server";

import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "./auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";


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
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const price = formData.get("price") as string;
    const imageFile = formData.get("image") as File;
    const guests = formData.get("guest") as string;
    const bedrooms = formData.get("bedroom") as string;
    const bathrooms = formData.get("bathroom") as string;

    // Validate required fields
    if (!listingId) {
      return redirect(`/create?error=Missing listing ID`);
    }

    if (!title || !description || !price) {
      return redirect(`/create/${listingId}/description?error=Please fill in all required fields`);
    }

    if (!imageFile || imageFile.size === 0) {
      return redirect(`/create/${listingId}/description?error=Please upload an image`);
    }

    const guestsNum = Number(guests);
    const bedroomsNum = Number(bedrooms);
    const bathroomsNum = Number(bathrooms);

    if (guestsNum <= 0 || bedroomsNum <= 0 || bathroomsNum <= 0) {
      return redirect(`/create/${listingId}/description?error=Please specify guests, bedrooms, and bathrooms`);
    }

    // Validate image file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (imageFile.size > maxSize) {
      return redirect(`/create/${listingId}/description?error=Image size must be less than 5MB`);
    }

    const supabase = await createClient();

    // Upload image
    const filePath = `${listingId}/${imageFile.name}-${Date.now()}`;

    const { data: imageData, error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, imageFile, {
        cacheControl: "2592000",
        contentType: imageFile.type,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return redirect(`/create/${listingId}/description?error=Failed to upload image. Please try again.`);
    }

    const photoUrl = imageData?.path;

    if (!photoUrl) {
      return redirect(`/create/${listingId}/description?error=Image upload failed. Please try again.`);
    }

    // Create listing description
    await serverCaller.createListing.createDescription({
      title,
      description,
      price: price,
      listingId,
      bedrooms:bedrooms,
      bathrooms: bathrooms,
      guests: guests,
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
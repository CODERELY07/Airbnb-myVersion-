// app/actions/createCategoryAction.ts

"use server";

import { serverCaller } from "@/trpc/server";
import { getClientUserProfile } from "./auth";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";


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
  const countryValue = formData.get("countryValue") as string;

   if (!listingId || !countryValue) {
    throw new Error("Missing required fields");
  }

  
  await serverCaller.createListing.createLocation({
    listingId,
    countryValue, 
  });
  
  return redirect("/");
}

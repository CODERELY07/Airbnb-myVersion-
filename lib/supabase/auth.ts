'use server'
import { createClient } from "@/utils/supabase/server";
import { createServerClient } from "@supabase/ssr";

export const getClientUserProfile = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const { user_metadata, app_metadata, email } = data.user;

  return {
    id: data.user.id ?? null,
    name: user_metadata?.name ?? null,
    email: email,
    username: user_metadata?.user_name ?? null,
    avatar: user_metadata?.avatar_url ?? null,
    provider: app_metadata?.provider ?? null,
  };
};



// export async function createCategoryPage(formData: FormData) {
//   const categoryName = formData.get("categoryName") as string;
//   const homeId = formData.get("homeId") as string;
//   const data = await prisma.home.update({
//     where: {
//       id: homeId,
//     },
//     data: {
//       categoryName: categoryName,
//       addedCategory: true,
//     },
//   });

//   return redirect(`/create/${homeId}/description`);
// }

// export async function CreateDescription(formData: FormData) {
//   const title = formData.get("title") as string;
//   const description = formData.get("description") as string;
//   const price = formData.get("price");
//   const imageFile = formData.get("image") as File;
//   const homeId = formData.get("homeId") as string;

//   const guestNumber = formData.get("guest") as string;
//   const roomNumber = formData.get("room") as string;
//   const bathroomsNumber = formData.get("bathroom") as string;

//   const { data: imageData } = await supabase.storage
//     .from("images")
//     .upload(`${imageFile.name}-${new Date()}`, imageFile, {
//       cacheControl: "2592000",
//       contentType: "image/png",
//     });

//   const data = await prisma.home.update({
//     where: {
//       id: homeId,
//     },
//     data: {
//       title: title,
//       description: description,
//       price: Number(price),
//       bedrooms: roomNumber,
//       bathrooms: bathroomsNumber,
//       guests: guestNumber,
//       photo: imageData?.path,
//       addedDescription: true,
//     },
//   });

//   return redirect(`/create/${homeId}/address`);
// }

// export async function createLocation(formData: FormData) {
//   const homeId = formData.get("homeId") as string;
//   const countryValue = formData.get("countryValue") as string;
//   const data = await prisma.home.update({
//     where: {
//       id: homeId,
//     },
//     data: {
//       addedLoaction: true,
//       country: countryValue,
//     },
//   });

//   return redirect("/");
// }

// export async function addToFavorite(formData: FormData) {
//   const homeId = formData.get("homeId") as string;
//   const userId = formData.get("userId") as string;
//   const pathName = formData.get("pathName") as string;

//   const data = await prisma.favorite.create({
//     data: {
//       homeId: homeId,
//       userId: userId,
//     },
//   });

//   revalidatePath(pathName);
// }

// export async function DeleteFromFavorite(formData: FormData) {
//   const favoriteId = formData.get("favoriteId") as string;
//   const pathName = formData.get("pathName") as string;
//   const userId = formData.get("userId") as string;

//   const data = await prisma.favorite.delete({
//     where: {
//       id: favoriteId,
//       userId: userId,
//     },
//   });

//   revalidatePath(pathName);
// }

// export async function createReservation(formData: FormData) {
//   const userId = formData.get("userId") as string;
//   const homeId = formData.get("homeId") as string;
//   const startDate = formData.get("startDate") as string;
//   const endDate = formData.get("endDate") as string;

//   const data = await prisma.reservation.create({
//     data: {
//       userId: userId,
//       endDate: endDate,
//       startDate: startDate,
//       homeId: homeId,
//     },
//   });

//   return redirect("/");
// }
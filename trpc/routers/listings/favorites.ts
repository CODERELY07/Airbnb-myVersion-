import { z } from "zod";
import { revalidatePath } from "next/cache";
import { baseProcedure } from "../../init";
import { createClient } from "@/utils/supabase/server";
import { throwIfError } from "../helpers";

// Favorites (RLS keeps them private to each user)

export const favoriteProcedures = {
  fetchFavListings: baseProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("favorites").select("*, listings(*)").eq("userId", input.userId);
    throwIfError(error);
    return data ?? [];
  }),

  addToFavorite: baseProcedure
    .input(z.object({ listingId: z.string(), pathName: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { error } = await supabase.from("favorites").insert({ listingId: input.listingId, userId: input.userId });

      // 23505 = already a favorite (double click): nothing to do
      if (error && error.code !== "23505") throwIfError(error);
      revalidatePath(input.pathName);
    }),

  removeFromFavorite: baseProcedure
    .input(z.object({ favoriteId: z.string(), pathName: z.string() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { error } = await supabase.from("favorites").delete().eq("id", input.favoriteId);
      throwIfError(error);
      revalidatePath(input.pathName);
    }),
};

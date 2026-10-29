import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../../init";
import { createClient } from "@/utils/supabase/server";
import { listingDetailsSchema } from "@/lib/validation";
import { throwIfError } from "../helpers";

// Editing and deleting your own listing (RLS also blocks other people's)

export const manageProcedures = {
  updateCategory: baseProcedure
    .input(z.object({ listingId: z.string(), categoryName: z.string() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { error } = await supabase
        .from("listings")
        .update({ categoryName: input.categoryName })
        .eq("id", input.listingId);
      throwIfError(error);
    }),

  // Details; every field optional, only the ones sent are changed
  updateListing: baseProcedure
    .input(
      z
        .object({ listingId: z.string().uuid(), photo: z.string().min(1).optional() })
        .extend(listingDetailsSchema.partial().shape)
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { listingId, ...fields } = input;
      const changes = Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

      const { error } = await supabase.from("listings").update(changes).eq("id", listingId);
      throwIfError(error);
    }),

  updateLocation: baseProcedure
    .input(
      z.object({
        listingId: z.string(),
        regionCode: z.string(),
        provinceCode: z.string(),
        munCityCode: z.string(),
        barangayCode: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { listingId, ...codes } = input;
      const { error } = await supabase.from("listings").update(codes).eq("id", listingId);
      throwIfError(error);
    }),

  deleteListing: baseProcedure
    .input(z.object({ listingId: z.string(), userId: z.string() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { listingId, userId } = input;

      const { data: listing } = await supabase
        .from("listings")
        .select("photo")
        .eq("id", listingId)
        .eq("userId", userId)
        .maybeSingle();

      if (!listing) throw new TRPCError({ code: "NOT_FOUND", message: "Listing not found" });

      // Guests who already paid must not lose their booking
      const { data: upcoming, error: bookingsError } = await supabase
        .from("reservation_dates")
        .select("listingId")
        .eq("listingId", listingId)
        .eq("isPaid", true)
        .gt("endDate", new Date().toISOString())
        .limit(1);
      throwIfError(bookingsError);

      if (upcoming?.length) {
        throw new TRPCError({
          code: "PRECONDITION_FAILED",
          message: "This listing has upcoming paid bookings, so it can't be deleted yet.",
        });
      }

      // Delete the listing first, then its photo (a leftover photo is harmless, a missing one isn't)
      const { error } = await supabase.from("listings").delete().eq("id", listingId).eq("userId", userId);
      throwIfError(error);

      if (listing.photo) {
        const { error: storageError } = await supabase.storage.from("images").remove([listing.photo]);
        if (storageError) console.error("Failed to delete image:", storageError);
      }
    }),
};

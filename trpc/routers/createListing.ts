import { z } from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { createClient } from "@/utils/supabase/server";
import { listingDetailsSchema } from "@/lib/validation";
import { throwIfError } from "./helpers";

// The 3-step "List your home" flow: structure → description → address

export const createListingRouter = createTRPCRouter({
  // Reuse your unfinished draft, or start a new one. Returns where to continue.
  createListing: baseProcedure.input(z.object({ userId: z.string() })).mutation(async ({ input }) => {
    const supabase = await createClient();

    const { data: draft } = await supabase
      .from("listings")
      .select("id, addedCategory, addedDescription, addedLocation")
      .eq("userId", input.userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (draft && !draft.addedCategory) return { id: draft.id, type: "structure" };
    if (draft && !draft.addedDescription) return { id: draft.id, type: "description" };
    if (draft && !draft.addedLocation) return { id: draft.id, type: "address" };

    // No draft, or the last one is finished: start a new listing
    const { data: created, error } = await supabase
      .from("listings")
      .insert({ userId: input.userId })
      .select("id")
      .single();
    throwIfError(error);

    return { id: created!.id, type: "structure" };
  }),

  // Step 2
  createDescription: baseProcedure
    .input(listingDetailsSchema.extend({ listingId: z.string().uuid(), photo: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { listingId, ...details } = input;

      const { error } = await supabase
        .from("listings")
        .update({ ...details, addedDescription: true })
        .eq("id", listingId);
      throwIfError(error);
    }),

  // Step 3
  createLocation: baseProcedure
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

      const { error } = await supabase
        .from("listings")
        .update({ ...codes, addedLocation: true })
        .eq("id", listingId);
      throwIfError(error);
    }),
});

export const createCategoryRouter = createTRPCRouter({
  // Step 1
  createCategory: baseProcedure
    .input(z.object({ userId: z.string(), listingId: z.string(), categoryName: z.string() }))
    .mutation(async ({ input }) => {
      const supabase = await createClient();
      const { userId, listingId, categoryName } = input;

      const { error } = await supabase
        .from("listings")
        .update({ userId, user_id: userId, categoryName, addedCategory: true })
        .eq("id", listingId);
      throwIfError(error);
    }),
});

import { z } from "zod";
import { baseProcedure } from "../../init";
import { createClient } from "@/utils/supabase/server";
import { activeReservationFilter, DAY_PATTERN, manilaMidnight } from "@/lib/utils";
import { publishedListings, throwIfError } from "../helpers";

// Reading listings: home page, listing page, search

export const browseProcedures = {
  // Home page (optional category) and My listings (optional owner)
  fetchListings: baseProcedure
    .input(z.object({ searchParams: z.string().optional(), userId: z.string().optional() }))
    .query(async ({ input }) => {
      const supabase = await createClient();
      let query = publishedListings(supabase);

      if (input.searchParams) query = query.eq("categoryName", input.searchParams);
      if (input.userId) query = query.eq("userId", input.userId);

      const { data, error } = await query;
      throwIfError(error);
      return data ?? [];
    }),

  // One listing with its host
  getListingData: baseProcedure.input(z.object({ listingId: z.string() })).query(async ({ input }) => {
    const supabase = await createClient();
    const { data } = await supabase.from("listings").select("*, users(*)").eq("id", input.listingId).maybeSingle();
    return { listing: data, user: data?.users };
  }),

  // Search by province, capacity and free dates
  searchListings: baseProcedure
    .input(
      z.object({
        destination: z.string().regex(/^\d{3}$/).optional(), // PSGC province code
        checkIn: z.string().regex(DAY_PATTERN).optional(),
        checkOut: z.string().regex(DAY_PATTERN).optional(),
        guests: z.number().optional(),
        bedrooms: z.number().optional(),
        bathrooms: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const supabase = await createClient();
      let query = publishedListings(supabase);

      if (input.destination) query = query.eq("provinceCode", input.destination);
      if (input.guests) query = query.gte("guests", input.guests);
      if (input.bedrooms) query = query.gte("bedrooms", input.bedrooms);
      if (input.bathrooms) query = query.gte("bathrooms", input.bathrooms);

      const { data: listings, error } = await query;
      throwIfError(error);

      if (!input.checkIn || !input.checkOut) return listings ?? [];

      // Bookings that overlap the requested stay:
      // starts before my checkout and ends after my check-in (same-day turnover allowed)
      const { data: booked, error: bookedError } = await supabase
        .from("reservation_dates")
        .select("listingId")
        .lt("startDate", manilaMidnight(input.checkOut).toISOString())
        .gt("endDate", manilaMidnight(input.checkIn).toISOString())
        .or(activeReservationFilter());
      throwIfError(bookedError);

      const bookedIds = new Set(booked?.map((r) => r.listingId));
      return (listings ?? []).filter((listing) => !bookedIds.has(listing.id));
    }),
};

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { baseProcedure } from "../../init";
import { createClient } from "@/utils/supabase/server";
import { activeReservationFilter } from "@/lib/utils";
import { throwIfError } from "../helpers";

// Reading bookings. Creating and paying happens in app/api/payments.

export const reservationProcedures = {
  // Booked dates of one listing, for the calendar (public view: dates only, no guest info)
  fetchReservation: baseProcedure.input(z.object({ listingId: z.string() })).query(async ({ input }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservation_dates")
      .select("startDate, endDate")
      .eq("listingId", input.listingId)
      .or(activeReservationFilter());
    throwIfError(error);
    return data ?? [];
  }),

  // Guest: my paid stays
  getReservationListings: baseProcedure.input(z.object({ userId: z.string() })).query(async ({ input }) => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("reservation")
      .select("*, users(*), listings(*)")
      .eq("userId", input.userId)
      .eq("isPaid", true)
      .order("startDate", { ascending: true });
    throwIfError(error);
    return data ?? [];
  }),

  // Host: paid bookings of my listings (user from the session, not from input)
  getHostBookings: baseProcedure.query(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new TRPCError({ code: "UNAUTHORIZED" });

    const { data, error } = await supabase
      .from("reservation")
      .select(
        'id, "startDate", "endDate", nights, "totalPrice", created_at, users(full_name, avatar_url), listings!inner(id, title, photo, "userId")'
      )
      .eq("listings.userId", user.id)
      .eq("isPaid", true)
      .order("startDate", { ascending: true });
    throwIfError(error);
    return data ?? [];
  }),
};

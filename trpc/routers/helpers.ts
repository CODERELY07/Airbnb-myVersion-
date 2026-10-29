import { TRPCError } from "@trpc/server";
import { createClient } from "@/utils/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

// Turn a Supabase error into a tRPC error (does nothing when there is no error)
export function throwIfError(error: { message: string } | null) {
  if (error) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: error.message });
}

// Listings that finished all 3 create steps, oldest first (stable order)
export function publishedListings(supabase: Supabase) {
  return supabase
    .from("listings")
    .select("*, favorites(*)")
    .eq("addedCategory", true)
    .eq("addedDescription", true)
    .eq("addedLocation", true)
    .order("created_at", { ascending: true });
}

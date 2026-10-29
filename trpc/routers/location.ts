import { baseProcedure, createTRPCRouter } from "../init";
import { createClient } from "@/utils/supabase/server";
import { getProvinceName } from "@/app/lib/locationHelpers";
import { throwIfError } from "./helpers";

export const locationRouter = createTRPCRouter({
  // Provinces that have at least one listing, for the search box
  listUnique: baseProcedure.query(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("listings")
      .select("regionCode, provinceCode")
      .eq("addedLocation", true)
      .not("provinceCode", "is", null);
    throwIfError(error);

    const provinces = new Map<string, string>();
    for (const item of data ?? []) {
      if (!provinces.has(item.provinceCode)) {
        provinces.set(item.provinceCode, getProvinceName(item.regionCode, item.provinceCode));
      }
    }
    return [...provinces].map(([provinceCode, provinceName]) => ({ provinceCode, provinceName }));
  }),
});

import z from "zod";
import { baseProcedure, createTRPCRouter } from "../init";
import { createClient } from "@/utils/supabase/server";
import { getClientUserProfile } from "@/lib/supabase/auth";

export const authRouter = createTRPCRouter({
    // getSession: baseProcedure
    // .input(
    //   z.object({
    //     text: z.string(),
    //   }),
    // )
    // .query(async ({input}) => {
    //   const profile = await getClientUserProfile();
    //    return {
    //     greeting: `Hello ${input.text}, from ${profile?.name ?? 'anonymous'}`,
    //    };
    // }),
})
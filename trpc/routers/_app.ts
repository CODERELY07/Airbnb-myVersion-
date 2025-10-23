import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { getClientUserProfile } from '@/lib/supabase/auth';
import { createClient } from '@/utils/supabase/server';
import { authRouter } from './auth';
import { CategoryRouter, homeRouter, ListingsRouter } from './listings';

export const appRouter = createTRPCRouter({
  greetings: authRouter,
  createListing: homeRouter,
  createCategory: CategoryRouter,
  listings: ListingsRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

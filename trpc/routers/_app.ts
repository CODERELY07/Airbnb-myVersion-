import { z } from 'zod';
import { baseProcedure, createTRPCRouter } from '../init';
import { getClientUserProfile } from '@/lib/supabase/auth';
import { createClient } from '@/utils/supabase/server';
import { authRouter } from './auth';
export const appRouter = createTRPCRouter({
 
  greetings: authRouter,
});
// export type definition of API
export type AppRouter = typeof appRouter;

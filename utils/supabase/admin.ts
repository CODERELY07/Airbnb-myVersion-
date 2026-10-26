import 'server-only';
import { createClient } from "@supabase/supabase-js";

// Server-only client that bypasses RLS.
// Only used to mark reservations as paid after PayMongo confirms the payment.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

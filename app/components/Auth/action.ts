'use server'
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { BASE_URL } from "@/lib/utils"
import demoAccounts from "@/lib/demoAccounts.json"


const GOOGLE_UNAVAILABLE = 'Google sign-in is not available right now. Try a demo account.';

// Is Google turned on in Supabase? Without this check a disabled provider
// sends the user to a raw JSON error page.
async function isGoogleEnabled() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY! },
      next: { revalidate: 300 },
    });
    const settings = await res.json();
    return settings?.external?.google === true;
  } catch {
    return false;
  }
}

const signInWithGoogle = async () => {
  if (!(await isGoogleEnabled())) {
    console.error('Google provider is disabled in Supabase (Authentication > Sign In / Providers)');
    return { error: GOOGLE_UNAVAILABLE };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
    },
  });

  if (error || !data?.url) {
    console.error('OAuth sign-in error:', error);
    return { error: GOOGLE_UNAVAILABLE };
  }

  redirect(data.url);
};

// Portfolio demo login. The password stays on the server (DEMO_ACCOUNT_PASSWORD).
const signInAsDemo = async (role: string) => {
  const account = demoAccounts.find((a) => a.role === role);
  const password = process.env.DEMO_ACCOUNT_PASSWORD;

  if (!account || !password) {
    // Shows in the server / Vercel logs so the cause is easy to find
    console.error(!account ? `Unknown demo role: ${role}` : 'DEMO_ACCOUNT_PASSWORD is not set');
    return { error: 'Demo accounts are not available right now.' };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password,
  });

  if (error) {
    console.error(`Demo sign-in failed for ${account.email}:`, error.message);
    return { error: 'Demo accounts are not available right now.' };
  }

  return { success: true };
};

const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
};

export { signInWithGoogle, signInAsDemo, signOut };

'use server'
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"
import { BASE_URL } from "@/lib/utils"


const signInWithGoogle = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${BASE_URL}/auth/callback`,
    },
  });
  // console.log( `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);


  if (error) {
    console.error('OAuth sign-in error:', error);
    throw error;
  }

  if (data?.url) {
    redirect(data.url);
      
  }
};

const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
};

export { signInWithGoogle, signOut };

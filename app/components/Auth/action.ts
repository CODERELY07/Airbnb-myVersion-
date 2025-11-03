'use server'
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

// const getURL = () => {
//   let url =
//     process?.env?.NEXT_PUBLIC_SITE_URL ??
//     process?.env?.NEXT_PUBLIC_VERCEL_URL ??
//     'http://localhost:3000';


//   if (!url.startsWith('http')) {
//     url = `https://${url}`;
//   }


//   url = `${url.replace(/\/$/, '')}/auth/callback`;

//   return url;
// };

const signInWithGoogle = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `https://airbnb-simple-clone-gilt.vercel.app/auth/callback`,
    },
  });
  console.log( `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`);


  if (error) {
    console.error('OAuth sign-in error:', error);
    throw error;
  }

  if (data?.url) {
    console.log("data", data);
    redirect(data.url);
      
  }
};

const signOut = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
};

export { signInWithGoogle, signOut };

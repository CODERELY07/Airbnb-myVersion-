'use server'
import { createClient } from "@/utils/supabase/server"
import { create } from "domain"
import { redirect } from "next/navigation"

const getURL = () => {
  let url =
    process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
    process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
    'http://localhost:3000'
    // Make sure to include `https://` when not localhost.
    // url = url.startsWith('http') ? url : `https://${url}/auth/callback`
    // // Make sure to include a trailing `/`.
    // url = url.endsWith('/') ? url : `${url}/`
    url = `${url}/auth/callback`;
    return url
}

const signInWithGoogle = async () => {

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider : 'google',
        options: {
            redirectTo: getURL(),
        },
    })

    console.log(data);

    if (data.url) {
        redirect(data.url) 
    }
}

const signOut = async () => {
    const supabase =  await createClient();
    await supabase.auth.signOut();
}
export { signInWithGoogle , signOut};
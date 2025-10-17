'use server'
import { createClient } from "@/utils/supabase/server"
import { create } from "domain";

export const getClientUserProfile = async () => {
  
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) return null;

  const { user_metadata, app_metadata, email } = data.user;

  return {
    name: user_metadata?.name ?? null,
    email: email,
    username: user_metadata?.user_name ?? null,
    avatar: user_metadata?.avatar_url ?? null,
    provider: app_metadata?.provider ?? null,
  };
};
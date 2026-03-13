import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabaseServer: SupabaseClient | null = null;

/**
 * Server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Use this for admin operations in API routes — never expose on the client.
 */
export function getSupabaseServer(): SupabaseClient | null {
  if (supabaseServer) return supabaseServer;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) return null;

  supabaseServer = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseServer;
}

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { requireSupabaseEnv } from "./env";

export function createSupabaseBrowserClient() {
  const { supabaseAnonKey, supabaseUrl } = requireSupabaseEnv();

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

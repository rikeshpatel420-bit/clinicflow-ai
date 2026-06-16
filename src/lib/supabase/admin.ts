import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { requireServiceSupabaseEnv } from "@/lib/backend/env";

export function createSupabaseAdminClient() {
  const { supabaseServiceRoleKey, supabaseUrl } = requireServiceSupabaseEnv();

  return createClient<Database>(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

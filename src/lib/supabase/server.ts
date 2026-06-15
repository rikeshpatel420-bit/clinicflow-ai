import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";
import { getSupabaseEnv, requireSupabaseEnv } from "./env";

export async function createSupabaseServerClient() {
  const { supabaseAnonKey, supabaseUrl } = requireSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server components cannot always write cookies. Middleware refreshes sessions.
        }
      },
    },
  });
}

export async function getCurrentUser() {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

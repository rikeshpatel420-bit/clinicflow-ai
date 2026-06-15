export function getSupabaseEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return {
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
    supabaseAnonKey,
    supabaseUrl,
  };
}

export function requireSupabaseEnv() {
  const env = getSupabaseEnv();

  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    throw new Error("Missing required Supabase environment variables.");
  }

  return {
    supabaseAnonKey: env.supabaseAnonKey,
    supabaseUrl: env.supabaseUrl,
  };
}

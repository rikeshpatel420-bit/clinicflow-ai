import type { User } from "@supabase/supabase-js";

export type AuthSessionContext = {
  user: User | null;
  isAuthenticated: boolean;
  authMode: "supabase" | "demo";
};

export function createSessionContext(user: User | null, isSupabaseConfigured: boolean): AuthSessionContext {
  return {
    authMode: isSupabaseConfigured ? "supabase" : "demo",
    isAuthenticated: Boolean(user),
    user,
  };
}

export function requireAuthenticatedSession(context: AuthSessionContext) {
  if (!context.isAuthenticated) {
    return { ok: false as const, reason: "Authentication required." };
  }

  return { ok: true as const, user: context.user };
}


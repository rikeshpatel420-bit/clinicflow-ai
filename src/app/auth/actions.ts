"use server";

import { redirect } from "next/navigation";
import { getBackendEnv } from "@/lib/backend/env";
import { getActiveClinicMembership, createClinicWorkspaceForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function redirectWithMessage(pathname: string, type: "error" | "message", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${pathname}?${params.toString()}`);
}

function nextPath(formData: FormData) {
  const value = formValue(formData, "next");
  return value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

export async function loginAction(formData: FormData) {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured) {
    redirectWithMessage("/login", "error", "Supabase is not configured.");
  }

  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  if (!email || !password) {
    redirectWithMessage("/login", "error", "Email and password are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirectWithMessage("/login", "error", "Invalid email or password.");
  }

  const user = data.user;
  const membership = await getActiveClinicMembership(user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  redirect(nextPath(formData));
}

export async function signupAction(formData: FormData) {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured) {
    redirectWithMessage("/signup", "error", "Supabase is not configured.");
  }

  const clinicName = formValue(formData, "clinicName");
  const fullName = formValue(formData, "fullName");
  const email = formValue(formData, "email");
  const password = formValue(formData, "password");

  if (!clinicName || !fullName || !email || password.length < 8) {
    redirectWithMessage("/signup", "error", "Enter clinic name, owner name, email, and an 8+ character password.");
  }

  const supabase = await createSupabaseServerClient();
  const { siteUrl } = getBackendEnv();
  const { data, error } = await supabase.auth.signUp({
    email,
    options: {
      data: {
        clinic_name: clinicName,
        full_name: fullName,
      },
      emailRedirectTo: `${siteUrl}/dashboard`,
    },
    password,
  });

  if (error || !data.user) {
    redirectWithMessage("/signup", "error", error?.message ?? "Could not create the Supabase auth user.");
  }

  const workspace = await createClinicWorkspaceForUser({
    clinicName,
    fullName,
    user: data.user,
  });

  if (workspace.error) {
    redirectWithMessage("/signup", "error", workspace.error);
  }

  if (!data.session) {
    redirectWithMessage("/login", "message", "Account created. Confirm your email, then log in.");
  }

  redirect("/dashboard");
}

export async function logoutAction() {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (isSupabaseConfigured) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  redirect("/login");
}

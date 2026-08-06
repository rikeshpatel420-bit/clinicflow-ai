"use server";

import { redirect } from "next/navigation";
import { getBackendEnv } from "@/lib/backend/env";
import { createClinicWorkspaceForUser, resolveClinicAccessForUser } from "@/lib/auth/clinic-workspace";
import { logPasswordRecoveryAttempt } from "@/lib/auth/diagnostics";
import {
  initialPasswordResetState,
  initialPasswordUpdateState,
  loginErrorMessage,
  requestPasswordReset,
  updatePassword,
  type PasswordResetState,
  type PasswordUpdateState,
} from "@/lib/auth/flows";
import { clearPasswordRecoveryContext, hasPasswordRecoveryContext } from "@/lib/auth/recovery-context";
import { normalizeEmail, safeNextPath } from "@/lib/auth/validation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function formValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function rawFormValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "");
}

function redirectWithMessage(pathname: string, type: "error" | "message", message: string): never {
  const params = new URLSearchParams({ [type]: message });
  redirect(`${pathname}?${params.toString()}`);
}

function nextPath(formData: FormData) {
  return safeNextPath(formValue(formData, "next"));
}

export async function loginAction(formData: FormData) {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured) {
    redirectWithMessage("/login", "error", "Supabase is not configured.");
  }

  const email = normalizeEmail(formValue(formData, "email"));
  const password = rawFormValue(formData, "password");

  if (!email || !password) {
    redirectWithMessage("/login", "error", "Email and password are required.");
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirectWithMessage("/login", "error", loginErrorMessage(error));
  }

  const user = data.user;
  const access = await resolveClinicAccessForUser(user);

  if (access.reason) {
    await supabase.auth.signOut();
    const accessError = {
      "inactive-clinic": "Your clinic workspace is not active. Contact ClinicFlow support.",
      "inactive-membership": "Your clinic membership is not active. Ask the clinic owner to restore access.",
      "missing-clinic": "Your clinic workspace could not be found. Contact ClinicFlow support.",
      "missing-membership": "Your account is not linked to an active clinic. Contact ClinicFlow support.",
    }[access.reason];
    redirectWithMessage("/login", "error", accessError);
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
  const password = rawFormValue(formData, "password");

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
      emailRedirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/dashboard")}`,
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

export async function requestPasswordResetAction(
  previousState: PasswordResetState = initialPasswordResetState,
  formData: FormData,
): Promise<PasswordResetState> {
  void previousState;
  const email = formValue(formData, "email");
  const { isSupabaseConfigured } = getSupabaseEnv();
  const { siteUrl } = getBackendEnv();

  if (!isSupabaseConfigured) {
    const normalizedEmail = normalizeEmail(email);
    logPasswordRecoveryAttempt({
      accepted: false,
      email: normalizedEmail,
      errorCode: "supabase_not_configured",
      rateLimited: false,
      redirectOrigin: siteUrl,
    });
    return { message: "Password recovery is temporarily unavailable. Contact ClinicFlow support.", status: "error" };
  }

  const supabase = await createSupabaseServerClient();
  const redirectTo = `${siteUrl}/auth/callback?next=${encodeURIComponent("/update-password")}&type=recovery`;
  const result = await requestPasswordReset(supabase, { email, redirectTo });
  logPasswordRecoveryAttempt({
    ...result.diagnostic,
    redirectOrigin: siteUrl,
  });
  return result.state;
}

export async function updatePasswordAction(
  previousState: PasswordUpdateState = initialPasswordUpdateState,
  formData: FormData,
): Promise<PasswordUpdateState> {
  void previousState;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await hasPasswordRecoveryContext(user.id))) {
    return {
      message: "This reset session has expired. Request a new password-reset link.",
      status: "error",
    };
  }

  const result = await updatePassword(supabase, {
    confirmation: rawFormValue(formData, "confirmation"),
    password: rawFormValue(formData, "password"),
  });
  if (result) return result;

  await supabase.auth.signOut();
  await clearPasswordRecoveryContext();
  redirectWithMessage("/login", "message", "Password updated. Log in with your new password.");
}

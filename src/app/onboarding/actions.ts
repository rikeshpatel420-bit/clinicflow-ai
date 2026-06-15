"use server";

import { redirect } from "next/navigation";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser, createSupabaseServerClient } from "@/lib/supabase/server";

export type OnboardingState = {
  message: string | null;
  status: "idle" | "error";
};

export const initialOnboardingState: OnboardingState = {
  message: null,
  status: "idle",
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createClinicAction(
  _previousState: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured) {
    return {
      message: "Supabase env vars are missing. Add them before creating a real clinic workspace.",
      status: "error",
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      message: "Log in before creating a clinic workspace.",
      status: "error",
    };
  }

  const clinicName = String(formData.get("clinicName") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const timezone = String(formData.get("timezone") ?? "Europe/London").trim();

  if (!clinicName || !fullName) {
    return {
      message: "Clinic name and owner name are required.",
      status: "error",
    };
  }

  const supabase = await createSupabaseServerClient();
  const slug = `${slugify(clinicName)}-${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  const { data: clinic, error: clinicError } = await supabase
    .from("clinics")
    .insert({
      created_by: user.id,
      name: clinicName,
      phone: phone || null,
      slug,
      timezone: timezone || "Europe/London",
    })
    .select("*")
    .single();

  if (clinicError || !clinic) {
    return {
      message: "Could not create clinic workspace.",
      status: "error",
    };
  }

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      clinic_id: clinic.id,
      email: user.email,
      full_name: fullName,
      onboarding_completed_at: now,
      user_id: user.id,
    },
    { onConflict: "clinic_id,user_id" },
  );

  if (profileError) {
    return {
      message: "Clinic was created, but owner profile setup failed.",
      status: "error",
    };
  }

  const { error: membershipError } = await supabase.from("clinic_members").upsert(
    {
      clinic_id: clinic.id,
      joined_at: now,
      role: "owner",
      status: "active",
      user_id: user.id,
    },
    { onConflict: "clinic_id,user_id" },
  );

  if (membershipError) {
    return {
      message: "Clinic was created, but owner membership setup failed.",
      status: "error",
    };
  }

  redirect("/dashboard");
}

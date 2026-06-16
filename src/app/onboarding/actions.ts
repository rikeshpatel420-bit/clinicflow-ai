"use server";

import { redirect } from "next/navigation";
import { createClinicWorkspaceForUser } from "@/lib/auth/clinic-workspace";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export type OnboardingState = {
  message: string | null;
  status: "idle" | "error";
};

export const initialOnboardingState: OnboardingState = {
  message: null,
  status: "idle",
};

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

  const workspace = await createClinicWorkspaceForUser({
    clinicName,
    fullName,
    phone,
    timezone,
    user,
  });

  if (workspace.error) {
    return {
      message: workspace.error,
      status: "error",
    };
  }

  redirect("/dashboard");
}

"use server";

import { revalidatePath } from "next/cache";
import { createClinicWorkspaceForUser } from "@/lib/auth/clinic-workspace";
import { buildOnboardingBlueprint, generateOnboardingPackage, markOnboardingComplete } from "@/lib/onboarding";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";
import type { OnboardingActionState } from "@/lib/onboarding";

export const initialOnboardingState: OnboardingActionState = {
  generated: undefined,
  message: null,
  status: "idle",
};

export async function createClinicAction(
  _previousState: OnboardingActionState,
  formData: FormData,
): Promise<OnboardingActionState> {
  const { isSupabaseConfigured } = getSupabaseEnv();

  if (!isSupabaseConfigured) {
    return {
      generated: undefined,
      message: "Supabase env vars are missing. Add them before creating a real clinic workspace.",
      status: "error",
    };
  }

  const user = await getCurrentUser();

  if (!user) {
    return {
      generated: undefined,
      message: "Log in before creating a clinic workspace.",
      status: "error",
    };
  }

  const blueprint = buildOnboardingBlueprint(formData);

  if (!blueprint.businessName || !blueprint.ownerName || !blueprint.industry || !blueprint.greeting || !blueprint.aiPrompt) {
    return {
      generated: undefined,
      message: "Business name, owner name, industry, greeting, and AI prompt are required.",
      status: "error",
    };
  }

  const workspace = await createClinicWorkspaceForUser({
    clinicName: blueprint.businessName,
    fullName: blueprint.ownerName,
    phone: blueprint.businessPhone,
    timezone: blueprint.timezone,
    user,
  });

  if (workspace.error || !workspace.clinicId || !workspace.appUserId) {
    return {
      generated: undefined,
      message: workspace.error ?? "Could not complete the business workspace creation.",
      status: "error",
    };
  }

  const generated = generateOnboardingPackage(blueprint);
  await markOnboardingComplete({
    businessName: blueprint.businessName,
    clinicId: workspace.clinicId,
    email: user.email ?? null,
    fullName: blueprint.ownerName,
    userId: workspace.appUserId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/onboarding");
  revalidatePath("/platform");
  revalidatePath("/system");

  return {
    generated,
    message: `${generated.generatedProfile.blueprint.businessName} is ready. The workspace, brand package, prompts, and validation checks are generated.`,
    status: "success",
  };
}

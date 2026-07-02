import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function upsertProfileRow(input: {
  businessName: string;
  clinicId: string;
  email: string | null;
  fullName: string;
  onboardingCompletedAt: string | null;
  userId: string;
}) {
  const now = new Date().toISOString();
  const admin = createSupabaseAdminClient();

  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .eq("clinic_id", input.clinicId)
    .eq("user_id", input.userId)
    .maybeSingle<{ id: string }>();

  const payload = {
    clinic_id: input.clinicId,
    email: input.email,
    full_name: input.fullName || input.businessName,
    updated_at: now,
    user_id: input.userId,
  };

  if (existing?.id) {
    const updatePayload = input.onboardingCompletedAt
      ? { ...payload, onboarding_completed_at: input.onboardingCompletedAt }
      : payload;

    const { error } = await admin.from("profiles").update(updatePayload).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await admin
    .from("profiles")
    .insert({
      ...payload,
      onboarding_completed_at: input.onboardingCompletedAt,
      created_at: now,
    })
    .select("id")
    .single<{ id: string }>();

  if (error) throw error;

  return data?.id ?? null;
}

export async function syncOnboardingProfile(input: {
  businessName: string;
  clinicId: string;
  email: string | null;
  fullName: string;
  userId: string;
}) {
  try {
    return await upsertProfileRow({
      ...input,
      onboardingCompletedAt: null,
    });
  } catch {
    return null;
  }
}

export async function markOnboardingComplete(input: {
  businessName: string;
  clinicId: string;
  email: string | null;
  fullName: string;
  userId: string;
}) {
  const completedAt = new Date().toISOString();

  try {
    return await upsertProfileRow({
      ...input,
      onboardingCompletedAt: completedAt,
    });
  } catch {
    return null;
  }
}

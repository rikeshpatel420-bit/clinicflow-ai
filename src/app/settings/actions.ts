"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { createInitialClinicConfigurationFromForm, getClinicSettingsSnapshot, saveClinicSettingsSnapshot } from "@/lib/settings/store";
import { getCurrentUser } from "@/lib/supabase/server";

export async function saveClinicSettingsAction(formData: FormData) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login?next=/settings");
  }

  const membership = await getActiveClinicMembershipForUser(user);

  if (!membership) {
    redirect("/onboarding");
  }

  if (membership.role !== "owner" && membership.role !== "admin") {
    redirect("/settings?status=not-authorised");
  }

  const snapshot = await getClinicSettingsSnapshot(membership.clinic_id);
  const configuration = createInitialClinicConfigurationFromForm(formData, snapshot?.clinic.business_configuration ?? undefined);
  const { error } = await saveClinicSettingsSnapshot({
    clinicId: membership.clinic_id,
    configuration,
  });

  if (error) {
    redirect("/settings?status=error");
  }

  revalidatePath("/dashboard");
  revalidatePath("/organisation");
  revalidatePath("/billing");
  revalidatePath("/knowledge");
  revalidatePath("/team");
  revalidatePath("/system");
  revalidatePath("/settings");

  redirect("/settings?status=saved");
}

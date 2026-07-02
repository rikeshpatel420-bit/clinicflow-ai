import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Clinic } from "@/types/database";
import {
  buildClinicLaunchState,
  createDefaultClinicBusinessConfiguration,
  mergeClinicBusinessConfiguration,
  parseClinicBusinessConfiguration,
  type ClinicBusinessConfiguration,
  type ClinicLaunchState,
} from "./configuration";

export type ClinicSettingsSnapshot = {
  clinic: Pick<Clinic, "id" | "name" | "phone" | "timezone" | "updated_at"> & {
    business_configuration: ClinicBusinessConfiguration;
    launch_state: ClinicLaunchState;
    onboarding_draft: ClinicBusinessConfiguration;
  };
  ready: boolean;
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asConfiguration(value: unknown): Partial<ClinicBusinessConfiguration> | null {
  return isObject(value) ? value : null;
}

export async function getClinicSettingsSnapshot(clinicId: string): Promise<ClinicSettingsSnapshot> {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("clinics")
    .select("id,name,phone,timezone,updated_at,business_configuration,launch_state,onboarding_draft")
    .eq("id", clinicId)
    .maybeSingle<{
      business_configuration: unknown;
      id: string;
      launch_state: unknown;
      name: string;
      onboarding_draft: unknown;
      phone: string | null;
      timezone: string;
      updated_at: string;
    }>();

  if (error || !data) {
    return {
      clinic: {
        business_configuration: createDefaultClinicBusinessConfiguration(),
        id: clinicId,
        launch_state: buildClinicLaunchState(createDefaultClinicBusinessConfiguration()),
        name: "",
        onboarding_draft: createDefaultClinicBusinessConfiguration(),
        phone: null,
        timezone: "Europe/London",
        updated_at: new Date().toISOString(),
      },
      ready: false,
    };
  }

  const configuration = mergeClinicBusinessConfiguration(asConfiguration(data.business_configuration));
  const onboardingDraft = mergeClinicBusinessConfiguration(asConfiguration(data.onboarding_draft));
  const launchState = buildClinicLaunchState(configuration);

  return {
    clinic: {
      business_configuration: configuration,
      id: data.id,
      launch_state: isObject(data.launch_state) ? (data.launch_state as ClinicLaunchState) : launchState,
      name: data.name,
      onboarding_draft: onboardingDraft,
      phone: data.phone,
      timezone: data.timezone,
      updated_at: data.updated_at,
    },
    ready: launchState.ready,
  };
}

export async function saveClinicSettingsSnapshot(input: {
  clinicId: string;
  configuration: ClinicBusinessConfiguration;
}) {
  const admin = createSupabaseAdminClient();
  const launchState = buildClinicLaunchState(input.configuration);

  const { error } = await admin
    .from("clinics")
    .update({
      business_configuration: input.configuration,
      launch_state: launchState,
      onboarding_draft: input.configuration,
      name: input.configuration.businessProfile.businessName,
      phone: input.configuration.businessProfile.businessPhone || null,
      timezone: input.configuration.businessProfile.timezone || "Europe/London",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.clinicId);

  if (error) {
    return { error: error.message, launchState };
  }

  return { error: null, launchState };
}

export function createInitialClinicConfigurationFromForm(formData: FormData, existing?: unknown) {
  const current = mergeClinicBusinessConfiguration(asConfiguration(existing));
  return parseClinicBusinessConfiguration(formData, current);
}

export function initialBusinessConfiguration() {
  return createDefaultClinicBusinessConfiguration();
}

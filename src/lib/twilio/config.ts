import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBackendEnv } from "@/lib/backend/env";
import type { TwilioConnection } from "@/types/database";
import { decryptTwilioSecret, encryptTwilioSecret, maskAccountSid, normalizePhoneNumber } from "./crypto";

function getEncryptionSecret() {
  const env = getBackendEnv();
  return env.twilioConfigEncryptionSecret ?? env.supabaseServiceRoleKey ?? env.twilioWebhookSigningSecret ?? null;
}

function isMissingRelationError(error: { message?: string } | null | undefined) {
  return Boolean(error?.message?.toLowerCase().includes("twilio_connections"));
}

export type TwilioConnectionView = Pick<
  TwilioConnection,
  | "id"
  | "clinic_id"
  | "account_sid"
  | "voice_number"
  | "forward_to_number"
  | "status"
  | "last_validated_at"
  | "last_error"
  | "created_by"
  | "updated_by"
  | "created_at"
  | "updated_at"
> & {
  accountSidMasked: string;
  hasAuthToken: boolean;
};

export function toTwilioConnectionView(connection: TwilioConnection | null): TwilioConnectionView | null {
  if (!connection) {
    return null;
  }

  return {
    accountSidMasked: maskAccountSid(connection.account_sid),
    account_sid: connection.account_sid,
    clinic_id: connection.clinic_id,
    created_at: connection.created_at,
    created_by: connection.created_by,
    forward_to_number: connection.forward_to_number,
    hasAuthToken: Boolean(connection.auth_token_ciphertext),
    id: connection.id,
    last_error: connection.last_error,
    last_validated_at: connection.last_validated_at,
    status: connection.status,
    updated_at: connection.updated_at,
    updated_by: connection.updated_by,
    voice_number: connection.voice_number,
  };
}

export async function getTwilioConnectionForClinic(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("twilio_connections").select("*").eq("clinic_id", clinicId).maybeSingle<TwilioConnection>();

  if (error) {
    if (isMissingRelationError(error)) {
      return { connection: null, error: null, tableMissing: true };
    }

    return { connection: null, error: error.message, tableMissing: false };
  }

  return { connection: data ?? null, error: null, tableMissing: false };
}

export async function getTwilioConnectionForVoiceNumber(voiceNumber?: string | null) {
  const normalizedVoiceNumber = normalizePhoneNumber(voiceNumber);
  if (!normalizedVoiceNumber) {
    return { connection: null, error: null, tableMissing: false };
  }

  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("twilio_connections")
    .select("*")
    .eq("voice_number", normalizedVoiceNumber)
    .eq("status", "active")
    .maybeSingle<TwilioConnection>();

  if (error) {
    if (isMissingRelationError(error)) {
      return { connection: null, error: null, tableMissing: true };
    }

    return { connection: null, error: error.message, tableMissing: false };
  }

  return { connection: data ?? null, error: null, tableMissing: false };
}

export async function saveTwilioConnection(input: {
  accountSid: string;
  authToken: string;
  clinicId: string;
  createdBy: string | null;
  forwardToNumber: string;
  voiceNumber: string;
}) {
  const encryptionSecret = getEncryptionSecret();
  if (!encryptionSecret) {
    return { connection: null, error: "Missing Twilio encryption secret." };
  }

  const admin = createSupabaseAdminClient();
  const encrypted = encryptTwilioSecret(input.authToken.trim(), encryptionSecret);

  const { data, error } = await admin
    .from("twilio_connections")
    .upsert(
      {
        account_sid: input.accountSid.trim(),
        auth_token_ciphertext: encrypted.ciphertext,
        auth_token_iv: encrypted.iv,
        auth_token_tag: encrypted.tag,
        clinic_id: input.clinicId,
        created_by: input.createdBy,
        forward_to_number: normalizePhoneNumber(input.forwardToNumber) ?? input.forwardToNumber.trim(),
        status: "active",
        updated_by: input.createdBy,
        voice_number: normalizePhoneNumber(input.voiceNumber) ?? input.voiceNumber.trim(),
      },
      { onConflict: "clinic_id" },
    )
    .select("*")
    .single<TwilioConnection>();

  if (error) {
    return { connection: null, error: error.message };
  }

  return { connection: data ?? null, error: null };
}

export async function deleteTwilioConnection(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { error } = await admin.from("twilio_connections").delete().eq("clinic_id", clinicId);
  return { error: error?.message ?? null };
}

export function decryptConnectionAuthToken(connection: TwilioConnection) {
  const secret = getEncryptionSecret();
  if (!secret) return null;

  return decryptTwilioSecret(
    {
      ciphertext: connection.auth_token_ciphertext,
      iv: connection.auth_token_iv,
      tag: connection.auth_token_tag,
    },
    secret,
  );
}

export async function verifyTwilioConnection(connection: TwilioConnection) {
  const authToken = decryptConnectionAuthToken(connection);
  if (!authToken) {
    return { error: "Missing encrypted Twilio auth token." };
  }

  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${connection.account_sid}.json`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${connection.account_sid}:${authToken}`).toString("base64")}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return {
      error: body || `Twilio connection test failed with status ${response.status}.`,
    };
  }

  return {
    error: null,
  };
}

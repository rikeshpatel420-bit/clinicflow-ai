import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getBackendEnv } from "@/lib/backend/env";
import type { TwilioConnection } from "@/types/database";
import { decodeEncryptedTwilioSecret, decryptTwilioSecret, encodeEncryptedTwilioSecret, encryptTwilioSecret, maskAccountSid, normalizePhoneNumber } from "./crypto";

function getEncryptionSecret() {
  const env = getBackendEnv();
  return env.twilioConfigEncryptionSecret ?? env.supabaseServiceRoleKey ?? env.twilioWebhookSigningSecret ?? null;
}

export function isMissingTwilioConnectionsTableError(error: { message?: string } | string | null | undefined) {
  const message = typeof error === "string" ? error : error?.message ?? "";
  return message.toLowerCase().includes("twilio_connections");
}

export function isTwilioConnectionActive(connection: Pick<TwilioConnection, "active" | "status"> | null | undefined) {
  return Boolean(connection && (connection.active || connection.status === "active"));
}

export type TwilioConnectionView = Pick<
  TwilioConnection,
  | "id"
  | "clinic_id"
  | "account_sid"
  | "active"
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
  authTokenDecrypted: boolean;
  authTokenLast6: string | null;
  authTokenSource: "clinic-row" | "environment" | "missing";
  hasAuthToken: boolean;
};

export function toTwilioConnectionView(connection: TwilioConnection | null): TwilioConnectionView | null {
  if (!connection) {
    return null;
  }

  const active = isTwilioConnectionActive(connection);
  const hasAuthToken = Boolean(connection.encrypted_auth_token ?? connection.auth_token_ciphertext);
  const resolvedAuthToken = resolveTwilioSignatureAuthToken(connection);

  return {
    accountSidMasked: maskAccountSid(connection.account_sid),
    account_sid: connection.account_sid,
    active,
    clinic_id: connection.clinic_id,
    created_at: connection.created_at,
    created_by: connection.created_by,
    forward_to_number: connection.forward_to_number,
    authTokenDecrypted: resolvedAuthToken.authTokenSource === "clinic-row",
    authTokenLast6: resolvedAuthToken.authToken ? resolvedAuthToken.authToken.slice(-6) : null,
    authTokenSource: resolvedAuthToken.authTokenSource,
    hasAuthToken,
    id: connection.id,
    last_error: connection.last_error,
    last_validated_at: connection.last_validated_at,
    status: active ? "active" : connection.status,
    updated_at: connection.updated_at,
    updated_by: connection.updated_by,
    voice_number: connection.voice_number,
  };
}

export async function getTwilioConnectionForClinic(clinicId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin.from("twilio_connections").select("*").eq("clinic_id", clinicId).maybeSingle<TwilioConnection>();

  if (error) {
    if (isMissingTwilioConnectionsTableError(error)) {
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
    .maybeSingle<TwilioConnection>();

  if (error) {
    if (isMissingTwilioConnectionsTableError(error)) {
      return { connection: null, error: null, tableMissing: true };
    }

    return { connection: null, error: error.message, tableMissing: false };
  }

  const connection = data ?? null;
  if (connection && !isTwilioConnectionActive(connection)) {
    return { connection: null, error: "The Twilio connection is not active.", tableMissing: false };
  }

  return { connection, error: null, tableMissing: false };
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
  const encryptedAuthToken = encodeEncryptedTwilioSecret(encrypted);

  const { data, error } = await admin
    .from("twilio_connections")
    .upsert(
      {
        account_sid: input.accountSid.trim(),
        active: true,
        auth_token_ciphertext: encrypted.ciphertext,
        auth_token_iv: encrypted.iv,
        auth_token_tag: encrypted.tag,
        encrypted_auth_token: encryptedAuthToken,
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

  const encryptedAuthToken = decodeEncryptedTwilioSecret(connection.encrypted_auth_token);
  if (encryptedAuthToken) {
    try {
      return decryptTwilioSecret(encryptedAuthToken, secret);
    } catch {
      // Fall back to the legacy split-column payload below.
    }
  }

  return decryptTwilioSecret(
    {
      ciphertext: connection.auth_token_ciphertext,
      iv: connection.auth_token_iv,
      tag: connection.auth_token_tag,
    },
    secret,
  );
}

export function resolveTwilioSignatureAuthToken(connection: TwilioConnection | null | undefined) {
  const env = getBackendEnv();

  if (connection) {
    try {
      const decrypted = decryptConnectionAuthToken(connection);
      if (decrypted) {
        return {
          authToken: decrypted,
          authTokenDecrypted: true,
          authTokenSource: "clinic-row" as const,
        };
      }
    } catch {
      // Fall through to the environment token or a missing-token response below.
    }
  }

  const envToken = env.twilioAuthToken?.trim();
  if (envToken) {
    return {
      authToken: envToken,
      authTokenDecrypted: false,
      authTokenSource: "environment" as const,
    };
  }

  return {
    authToken: null,
    authTokenDecrypted: false,
    authTokenSource: "missing" as const,
  };
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

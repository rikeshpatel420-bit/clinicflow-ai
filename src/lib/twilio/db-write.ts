type SupabaseWriteError = {
  code?: string | null;
  details?: string | null;
  hint?: string | null;
  message?: string | null;
};

function normalizeError(error: unknown): SupabaseWriteError {
  if (!error || typeof error !== "object") {
    return { message: String(error ?? "Unknown database error") };
  }

  const candidate = error as Partial<SupabaseWriteError>;
  return {
    code: typeof candidate.code === "string" ? candidate.code : null,
    details: typeof candidate.details === "string" ? candidate.details : null,
    hint: typeof candidate.hint === "string" ? candidate.hint : null,
    message: typeof candidate.message === "string" ? candidate.message : String(error),
  };
}

export function isMissingRelationError(error: unknown) {
  const normalized = normalizeError(error);
  const message = normalized.message?.toLowerCase() ?? "";
  return (
    normalized.code === "PGRST205" ||
    message.includes("schema cache") ||
    message.includes("could not find the table") ||
    message.includes("does not exist") ||
    message.includes("relation")
  );
}

export function logTwilioDbWriteFailure(
  event: string,
  error: unknown,
  details: Record<string, unknown> = {},
) {
  console.error("[ClinicFlow Twilio]", event, JSON.stringify({ ...details, ...normalizeError(error) }));
}


import { createHash } from "node:crypto";

function emailFingerprint(email: string) {
  return createHash("sha256").update(email).digest("hex").slice(0, 16);
}

export function logPasswordRecoveryAttempt(input: {
  accepted: boolean;
  email: string;
  errorCode: string | null;
  rateLimited: boolean;
  redirectOrigin: string;
}) {
  console.info(
    "[ClinicFlow Auth]",
    "password_recovery_request",
    JSON.stringify({
      accepted: input.accepted,
      emailFingerprint: emailFingerprint(input.email),
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      errorCode: input.errorCode,
      rateLimited: input.rateLimited,
      redirectOrigin: input.redirectOrigin,
      timestamp: new Date().toISOString(),
    }),
  );
}

export function logAuthCallback(input: { errorCode: string | null; nextPath: string; success: boolean }) {
  console.info(
    "[ClinicFlow Auth]",
    "auth_callback",
    JSON.stringify({
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "unknown",
      errorCode: input.errorCode,
      nextPath: input.nextPath,
      success: input.success,
      timestamp: new Date().toISOString(),
    }),
  );
}

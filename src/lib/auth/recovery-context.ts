import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { requireServiceSupabaseEnv } from "@/lib/backend/env";

const RECOVERY_COOKIE = "clinicflow-password-recovery";
const RECOVERY_CONTEXT_TTL_SECONDS = 30 * 60;

function signingKey() {
  const { supabaseServiceRoleKey } = requireServiceSupabaseEnv();
  return createHmac("sha256", supabaseServiceRoleKey).update("clinicflow:password-recovery:v1").digest();
}

function signature(payload: string) {
  return createHmac("sha256", signingKey()).update(payload).digest("base64url");
}

function createToken(userId: string, expiresAt: number) {
  const payload = Buffer.from(JSON.stringify({ expiresAt, userId }), "utf8").toString("base64url");
  return `${payload}.${signature(payload)}`;
}

function verifyToken(token: string | undefined, userId: string) {
  if (!token) return false;
  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return false;

  const expectedSignature = signature(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return false;

  try {
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      expiresAt?: number;
      userId?: string;
    };
    return decoded.userId === userId && typeof decoded.expiresAt === "number" && decoded.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function setPasswordRecoveryContext(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(RECOVERY_COOKIE, createToken(userId, Date.now() + RECOVERY_CONTEXT_TTL_SECONDS * 1000), {
    httpOnly: true,
    maxAge: RECOVERY_CONTEXT_TTL_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function hasPasswordRecoveryContext(userId: string) {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(RECOVERY_COOKIE)?.value, userId);
}

export async function clearPasswordRecoveryContext() {
  const cookieStore = await cookies();
  cookieStore.delete(RECOVERY_COOKIE);
}

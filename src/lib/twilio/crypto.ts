import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

export type EncryptedSecret = {
  ciphertext: string;
  iv: string;
  tag: string;
};

function deriveKey(secret: string) {
  return createHash("sha256").update(secret, "utf8").digest();
}

export function normalizePhoneNumber(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  const normalized = trimmed.replace(/[^\d+]/g, "");
  return normalized || null;
}

export function hashPhoneNumber(value?: string | null) {
  const normalized = normalizePhoneNumber(value);
  if (!normalized) return null;

  return createHash("sha256").update(normalized, "utf8").digest("hex");
}

export function maskAccountSid(value?: string | null) {
  const sid = value?.trim();
  if (!sid) return "Not configured";

  if (sid.length <= 8) return `${sid.slice(0, 2)}***`;

  return `${sid.slice(0, 4)}...${sid.slice(-4)}`;
}

export function encryptTwilioSecret(value: string, secret: string): EncryptedSecret {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

export function decryptTwilioSecret(input: EncryptedSecret, secret: string) {
  const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), Buffer.from(input.iv, "base64"));
  decipher.setAuthTag(Buffer.from(input.tag, "base64"));

  return Buffer.concat([decipher.update(Buffer.from(input.ciphertext, "base64")), decipher.final()]).toString("utf8");
}

export function encodeEncryptedTwilioSecret(secret: EncryptedSecret) {
  return JSON.stringify(secret);
}

export function decodeEncryptedTwilioSecret(value?: string | null): EncryptedSecret | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<EncryptedSecret>;
    if (typeof parsed.ciphertext === "string" && typeof parsed.iv === "string" && typeof parsed.tag === "string") {
      return {
        ciphertext: parsed.ciphertext,
        iv: parsed.iv,
        tag: parsed.tag,
      };
    }
  } catch {
    return null;
  }

  return null;
}

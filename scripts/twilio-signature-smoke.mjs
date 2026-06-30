import assert from "node:assert/strict";
import { createHmac, timingSafeEqual } from "node:crypto";

function resolveTwilioPublicOrigin(url, headers) {
  const first = (value) => value?.split(",")[0]?.trim() ?? null;
  const forwardedHost = first(headers.get("x-forwarded-host")) ?? first(headers.get("x-original-host")) ?? first(headers.get("host"));
  if (!forwardedHost) {
    return new URL(url).origin.replace(/\/$/, "");
  }

  const forwardedProto = first(headers.get("x-forwarded-proto")) ?? (/(?:^|,)\s*(localhost|127\.0\.0\.1)(?:\s*|,|$)/i.test(forwardedHost) ? "http" : "https");
  return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
}

function buildTwilioValidationUrl(url, headers) {
  const origin = resolveTwilioPublicOrigin(url, headers);
  const parsed = new URL(url);
  return `${origin}${parsed.pathname}${parsed.search}`;
}

function buildTwilioSignaturePayload(url, formData) {
  if (!formData) return url;
  const params = Array.from(formData.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}${String(value)}`)
    .join("");
  return `${url}${params}`;
}

function createTwilioRequestSignature(url, authToken, formData) {
  return createHmac("sha1", authToken).update(buildTwilioSignaturePayload(url, formData), "utf8").digest("base64");
}

function verifyTwilioSignature(url, headers, authToken, formData) {
  const signature = headers.get("x-twilio-signature");
  if (!signature) {
    return false;
  }

  const expected = createTwilioRequestSignature(url, authToken, formData);
  const expectedBytes = Buffer.from(expected, "utf8");
  const providedBytes = Buffer.from(signature, "utf8");
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

const authToken = "twilio-test-auth-token";
const url = "https://www.clinicflowhq.co.uk/api/webhooks/twilio/voice?foo=bar";
const formData = new FormData();
formData.set("CallSid", "CA1234567890abcdef");
formData.set("CallStatus", "ringing");
formData.set("From", "+447700900123");
formData.set("To", "+447853309452");

const headers = new Headers({
  "x-forwarded-host": "www.clinicflowhq.co.uk",
  "x-forwarded-proto": "https",
});

const resolvedUrl = buildTwilioValidationUrl(url, headers);
assert.equal(resolvedUrl, url, "Production URL must preserve www and query strings");

const validSignature = createTwilioRequestSignature(url, authToken, formData);
const invalidSignature = `${validSignature.slice(0, -2)}zz`;

assert.equal(verifyTwilioSignature(url, new Headers({ ...Object.fromEntries(headers.entries()), "x-twilio-signature": validSignature }), authToken, formData), true, "A valid signature must pass");
assert.equal(verifyTwilioSignature(url, new Headers({ ...Object.fromEntries(headers.entries()), "x-twilio-signature": invalidSignature }), authToken, formData), false, "An invalid signature must fail");
assert.equal(buildTwilioValidationUrl("https://www.clinicflowhq.co.uk/api/webhooks/twilio/status", headers), "https://www.clinicflowhq.co.uk/api/webhooks/twilio/status");
assert.equal(buildTwilioValidationUrl("https://www.clinicflowhq.co.uk/api/webhooks/twilio/sms", headers), "https://www.clinicflowhq.co.uk/api/webhooks/twilio/sms");

console.log("Twilio signature smoke test passed.");

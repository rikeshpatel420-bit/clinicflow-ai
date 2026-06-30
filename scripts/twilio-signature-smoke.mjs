import assert from "node:assert/strict";
import twilio from "twilio";

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

function formDataToTwilioParams(formData) {
  const params = {};
  const keys = [];

  for (const [key, value] of formData.entries()) {
    keys.push(key);
    const normalizedValue = typeof value === "string" ? value : String(value?.name ?? value);
    const existing = params[key];

    if (existing === undefined) {
      params[key] = normalizedValue;
      continue;
    }

    if (Array.isArray(existing)) {
      existing.push(normalizedValue);
      continue;
    }

    params[key] = [existing, normalizedValue];
  }

  return { keys, params };
}

const authToken = "twilio-test-auth-token";
const url = "https://www.clinicflowhq.co.uk/api/webhooks/twilio/voice?foo=bar";
const formData = new FormData();
formData.append("CallSid", "CA1234567890abcdef");
formData.append("CallStatus", "ringing");
formData.append("From", "+447700900123");
formData.append("To", "+447853309452");
formData.append("MediaUrl", "https://media.example/a.mp3");
formData.append("MediaUrl", "https://media.example/b.mp3");

const headers = new Headers({
  "x-forwarded-host": "www.clinicflowhq.co.uk",
  "x-forwarded-proto": "https",
});

const resolvedUrl = buildTwilioValidationUrl(url, headers);
assert.equal(resolvedUrl, url, "Production URL must preserve www and query strings");

const { keys, params } = formDataToTwilioParams(formData);
assert.deepEqual(keys, ["CallSid", "CallStatus", "From", "To", "MediaUrl", "MediaUrl"], "Raw parameter keys must preserve duplicates");
assert.deepEqual(params.MediaUrl, ["https://media.example/a.mp3", "https://media.example/b.mp3"], "Duplicate keys should remain available as arrays");

const validSignature = twilio.getExpectedTwilioSignature(authToken, url, params);
const invalidSignature = `${validSignature.slice(0, -2)}zz`;

assert.equal(twilio.validateRequest(authToken, validSignature, url, params), true, "A valid signature must pass");
assert.equal(twilio.validateRequest(authToken, invalidSignature, url, params), false, "An invalid signature must fail");
assert.equal(buildTwilioValidationUrl("https://www.clinicflowhq.co.uk/api/webhooks/twilio/sms", headers), "https://www.clinicflowhq.co.uk/api/webhooks/twilio/sms");
assert.equal(
  buildTwilioValidationUrl("https://www.clinicflowhq.co.uk/api/webhooks/twilio/status", headers),
  "https://www.clinicflowhq.co.uk/api/webhooks/twilio/status",
);

console.log("Twilio signature smoke test passed.");

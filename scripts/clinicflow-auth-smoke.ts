import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { classifyClinicAccess } from "../src/lib/auth/clinic-workspace";
import {
  PASSWORD_RESET_NEUTRAL_MESSAGE,
  exchangeAuthCode,
  loginErrorMessage,
  requestPasswordReset,
  updatePassword,
} from "../src/lib/auth/flows";
import { isProtectedRoute } from "../src/lib/auth/routing";
import { isValidEmail, normalizeEmail, passwordValidationError, safeNextPath } from "../src/lib/auth/validation";

async function run() {
  let resetCalls = 0;
  let requestedEmail = "";
  let requestedRedirect = "";
  const acceptingClient = {
    auth: {
      resetPasswordForEmail: async (email: string, options: { redirectTo: string }) => {
        resetCalls += 1;
        requestedEmail = email;
        requestedRedirect = options.redirectTo;
        return { error: null };
      },
    },
  };

  const valid = await requestPasswordReset(acceptingClient, {
    email: "  RikeshPatel1987@Hotmail.co.uk  ",
    redirectTo: "https://www.clinicflowhq.co.uk/auth/callback?next=%2Fupdate-password&type=recovery",
  });
  assert.equal(valid.state.status, "success", "valid reset request must be accepted");
  assert.equal(requestedEmail, "rikeshpatel1987@hotmail.co.uk", "reset email must be normalised");
  assert.match(requestedRedirect, /^https:\/\/www\.clinicflowhq\.co\.uk\/auth\/callback/);

  const unknown = await requestPasswordReset(acceptingClient, {
    email: "unknown@example.test",
    redirectTo: requestedRedirect,
  });
  assert.equal(unknown.state.message, PASSWORD_RESET_NEUTRAL_MESSAGE, "unknown email response must remain neutral");
  assert.equal(valid.state.message, unknown.state.message, "known and unknown success messages must match");

  const invalid = await requestPasswordReset(acceptingClient, { email: "not-an-email", redirectTo: requestedRedirect });
  assert.equal(invalid.state.fieldError, "Enter a valid email address.");
  assert.equal(resetCalls, 2, "invalid email must not call Supabase");
  assert.equal(isValidEmail(normalizeEmail(" User@example.com ")), true);

  const rateLimited = await requestPasswordReset(
    {
      auth: {
        resetPasswordForEmail: async () => ({
          error: { code: "over_email_send_rate_limit", message: "rate limit", status: 429 },
        }),
      },
    },
    { email: "user@example.com", redirectTo: requestedRedirect },
  );
  assert.equal(rateLimited.state.rateLimited, true, "rate limits must be handled explicitly");

  const validExchange = await exchangeAuthCode(
    { auth: { exchangeCodeForSession: async () => ({ data: { user: { id: "auth-owner" } }, error: null }) } },
    "valid-code",
  );
  assert.equal(validExchange.userId, "auth-owner", "valid callback code must establish a user session");
  const invalidExchange = await exchangeAuthCode(
    {
      auth: {
        exchangeCodeForSession: async () => ({
          data: { user: null },
          error: { code: "bad_code_verifier", message: "expired", status: 400 },
        }),
      },
    },
    "expired-code",
  );
  assert.equal(invalidExchange.userId, null, "invalid callback code must be rejected");

  assert.equal(passwordValidationError("StrongPassword1", "DifferentPassword1"), "The passwords do not match.");
  let updatedPassword = "";
  const updateResult = await updatePassword(
    { auth: { updateUser: async ({ password }: { password: string }) => ((updatedPassword = password), { error: null }) } },
    { confirmation: "StrongPassword1", password: "StrongPassword1" },
  );
  assert.equal(updateResult, null, "valid password update must succeed");
  assert.equal(updatedPassword, "StrongPassword1");

  assert.equal(loginErrorMessage({ code: "invalid_credentials" }), "Invalid email or password.");
  const ownerAccess = classifyClinicAccess(
    { role: "owner", status: "active" },
    { deleted_at: null, name: "CF Dental", status: "active" },
  );
  assert.equal(ownerAccess, null, "active owner must resolve to CF Dental");

  assert.equal(isProtectedRoute("/dashboard"), true);
  assert.equal(isProtectedRoute("/calls/example"), true);
  assert.equal(isProtectedRoute("/login"), false);
  assert.equal(safeNextPath("/calls?status=missed"), "/calls?status=missed");
  assert.equal(safeNextPath("//attacker.example"), "/dashboard");
  assert.equal(safeNextPath("https://attacker.example"), "/dashboard");

  const authActions = readFileSync("src/app/auth/actions.ts", "utf8");
  const loginSection = authActions.slice(authActions.indexOf("export async function loginAction"), authActions.indexOf("export async function signupAction"));
  assert.equal(loginSection.includes("createClinicWorkspaceForUser"), false, "login must never create a clinic or owner account");
  assert.match(loginSection, /resolveClinicAccessForUser/, "normal login must resolve existing clinic access");

  const callbackRoute = readFileSync("src/app/auth/callback/route.ts", "utf8");
  assert.match(callbackRoute, /exchangeAuthCode/, "callback must exchange the PKCE code");
  assert.match(callbackRoute, /setPasswordRecoveryContext/, "callback must preserve recovery context");

  const diagnosticSource = readFileSync("src/lib/auth/diagnostics.ts", "utf8");
  assert.equal(/JSON\.stringify\([^)]*(password|token|authCode)/i.test(diagnosticSource), false, "diagnostics must not log secrets");

  console.log("ClinicFlow auth smoke passed: 14 recovery, login, tenancy, routing, and logging checks.");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

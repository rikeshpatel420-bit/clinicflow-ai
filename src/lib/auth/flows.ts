import { isValidEmail, normalizeEmail, passwordValidationError } from "./validation";

export const PASSWORD_RESET_NEUTRAL_MESSAGE =
  "If an account exists for that email, a password-reset link has been sent. Check your inbox and junk folder.";

export type AuthOperationError = {
  code?: string | null;
  message?: string | null;
  status?: number | null;
};

export type PasswordResetState = {
  fieldError?: string;
  message: string;
  requestAcceptedAt?: number;
  status: "error" | "idle" | "success";
  rateLimited?: boolean;
};

export type PasswordUpdateState = {
  fieldError?: string;
  message: string;
  status: "error" | "idle";
};

export const initialPasswordResetState: PasswordResetState = {
  message: "",
  status: "idle",
};

export const initialPasswordUpdateState: PasswordUpdateState = {
  message: "",
  status: "idle",
};

type PasswordRecoveryClient = {
  auth: {
    resetPasswordForEmail: (
      email: string,
      options: { redirectTo: string },
    ) => Promise<{ error: AuthOperationError | null }>;
  };
};

type PasswordUpdateClient = {
  auth: {
    updateUser: (attributes: { password: string }) => Promise<{ error: AuthOperationError | null }>;
  };
};

type CodeExchangeClient = {
  auth: {
    exchangeCodeForSession: (
      code: string,
    ) => Promise<{ data: { user: { id: string } | null }; error: AuthOperationError | null }>;
  };
};

function isRateLimitError(error: AuthOperationError) {
  return (
    error.status === 429 ||
    error.code === "over_email_send_rate_limit" ||
    error.code === "over_request_rate_limit" ||
    /rate limit|too many requests/i.test(error.message ?? "")
  );
}

function deliveryFailureMessage(error: AuthOperationError) {
  if (isRateLimitError(error)) {
    return "Too many reset links were requested. Please wait a few minutes and try again.";
  }

  if (error.status && error.status >= 500) {
    return "The reset email service is temporarily unavailable. Please try again shortly.";
  }

  return "We could not send a reset link right now. Please try again or contact ClinicFlow support.";
}

export function loginErrorMessage(error: AuthOperationError | null) {
  switch (error?.code) {
    case "email_not_confirmed":
      return "Confirm your email before logging in.";
    case "user_banned":
      return "This account is disabled. Contact ClinicFlow support.";
    case "over_request_rate_limit":
      return "Too many login attempts. Please wait a few minutes and try again.";
    case "invalid_credentials":
    default:
      return "Invalid email or password.";
  }
}

export async function requestPasswordReset(
  client: PasswordRecoveryClient,
  input: { email: string; redirectTo: string },
) {
  const email = normalizeEmail(input.email);
  if (!isValidEmail(email)) {
    return {
      diagnostic: { accepted: false, email, errorCode: "invalid_email", rateLimited: false },
      state: {
        fieldError: "Enter a valid email address.",
        message: "",
        status: "error",
      } satisfies PasswordResetState,
    };
  }

  try {
    const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: input.redirectTo });
    if (error) {
      const rateLimited = isRateLimitError(error);
      return {
        diagnostic: { accepted: false, email, errorCode: error.code ?? "auth_delivery_error", rateLimited },
        state: {
          message: deliveryFailureMessage(error),
          rateLimited,
          status: "error",
        } satisfies PasswordResetState,
      };
    }

    return {
      diagnostic: { accepted: true, email, errorCode: null, rateLimited: false },
      state: {
        message: PASSWORD_RESET_NEUTRAL_MESSAGE,
        requestAcceptedAt: Date.now(),
        status: "success",
      } satisfies PasswordResetState,
    };
  } catch {
    return {
      diagnostic: { accepted: false, email, errorCode: "network_error", rateLimited: false },
      state: {
        message: "The reset email service could not be reached. Please try again shortly.",
        status: "error",
      } satisfies PasswordResetState,
    };
  }
}

export async function updatePassword(
  client: PasswordUpdateClient,
  input: { confirmation: string; password: string },
) {
  const validationError = passwordValidationError(input.password, input.confirmation);
  if (validationError) {
    return {
      fieldError: validationError,
      message: "",
      status: "error",
    } satisfies PasswordUpdateState;
  }

  const { error } = await client.auth.updateUser({ password: input.password });
  if (error) {
    return {
      message:
        error.code === "same_password"
          ? "Choose a password you have not used for this account."
          : "Your password could not be updated. Request a new reset link and try again.",
      status: "error",
    } satisfies PasswordUpdateState;
  }

  return null;
}

export async function exchangeAuthCode(client: CodeExchangeClient, code: string | null) {
  if (!code) {
    return { errorCode: "missing_code", userId: null };
  }

  const { data, error } = await client.auth.exchangeCodeForSession(code);
  if (error || !data.user) {
    return { errorCode: error?.code ?? "invalid_or_expired_code", userId: null };
  }

  return { errorCode: null, userId: data.user.id };
}

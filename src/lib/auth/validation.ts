export const PASSWORD_REQUIREMENTS = {
  minLength: 10,
  description: "At least 10 characters, including a letter and a number.",
} as const;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isValidEmail(value: string) {
  const email = normalizeEmail(value);
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function passwordValidationError(password: string, confirmation: string) {
  if (password !== confirmation) {
    return "The passwords do not match.";
  }

  if (password.length < PASSWORD_REQUIREMENTS.minLength || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return PASSWORD_REQUIREMENTS.description;
  }

  return null;
}

export function safeNextPath(value: string | null | undefined, fallback = "/dashboard") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) {
    return fallback;
  }

  try {
    const parsed = new URL(value, "https://clinicflow.invalid");
    if (parsed.origin !== "https://clinicflow.invalid") {
      return fallback;
    }
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

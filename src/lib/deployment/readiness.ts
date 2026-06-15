export const deploymentReadinessChecks = [
  { key: "supabase_env", label: "Supabase env configured", required: true },
  { key: "middleware_routes", label: "Protected middleware routes configured", required: true },
  { key: "stripe_env", label: "Stripe env placeholders present", required: false },
  { key: "twilio_test_mode", label: "Twilio test mode enabled", required: true },
  { key: "health_endpoint", label: "Health endpoint available", required: true },
];

export function getDeploymentMode() {
  return process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "development";
}


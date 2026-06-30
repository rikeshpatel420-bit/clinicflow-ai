import type { User } from "@supabase/supabase-js";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getBackendEnv } from "@/lib/backend/env";
import { getDeploymentMode } from "@/lib/deployment/readiness";
import { getClinicDashboardData, type ClinicDashboardData } from "@/lib/dashboard/live-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { getTwilioPublicHealth, getTwilioSetupHealthForClinic, hasConfiguredTwilioSender, type TwilioSetupHealth } from "@/lib/twilio/health";
import { isTwilioConnectionActive } from "@/lib/twilio/config";

export type ReadinessStatus = "complete" | "missing" | "error";

export type ReadinessItem = {
  detail: string;
  label: string;
  status: ReadinessStatus;
  value: string;
};

export type ReadinessStep = ReadinessItem & {
  actionHref?: string;
  actionLabel?: string;
};

export type TableAuditItem = ReadinessItem & {
  note?: string;
};

export type ProductionReadinessReport = {
  blockers: string[];
  clinic: {
    id: string | null;
    membershipStatus: string;
    role: string | null;
  };
  deploymentMode: string;
  env: {
    openAiKey: boolean;
    siteUrl: boolean;
    supabaseAnonKey: boolean;
    supabaseServiceRoleKey: boolean;
    supabaseUrl: boolean;
    twilioConfigEncryptionSecret: boolean;
    twilioAuthToken: boolean;
    twilioMessagingServiceSid: boolean;
    twilioPhoneNumber: boolean;
    twilioSenderConfigured: boolean;
    twilioTestMode: boolean;
  };
  lastCheckedAt: string;
  routes: Array<{ href: string; label: string; status: ReadinessStatus; detail: string }>;
  steps: ReadinessStep[];
  tables: TableAuditItem[];
  twilio: {
    publicHealth: ReturnType<typeof getTwilioPublicHealth>;
    setupHealth: TwilioSetupHealth | null;
  };
  urls: {
    health: string;
    sms: string;
    status: string;
    voice: string;
  };
};

const requiredTables = [
  "users",
  "clinics",
  "clinic_users",
  "twilio_connections",
  "patient_leads",
  "calls",
  "recovery_workflows",
  "sms_events",
  "dashboard_metric_snapshots",
  "call_recordings",
  "voicemail_messages",
  "call_transcripts",
] as const;

function statusLabel(status: ReadinessStatus) {
  if (status === "complete") return "\u2714 Complete";
  if (status === "missing") return "\u26A0 Missing";
  return "\u274C Error";
}

function normalizedBaseUrl(baseUrl?: string | null) {
  return (baseUrl ?? getBackendEnv().siteUrl).replace(/\/$/, "");
}

function buildWebhookUrls(baseUrl?: string | null) {
  const origin = normalizedBaseUrl(baseUrl);
  return {
    health: `${origin}/api/system/health`,
    sms: `${origin}/api/webhooks/twilio/sms`,
    status: `${origin}/api/webhooks/twilio/status`,
    voice: `${origin}/api/webhooks/twilio/voice`,
  };
}

function buildEnvChecks() {
  const env = getBackendEnv();
  const supabase = getSupabaseEnv();

  return {
    openAiKey: Boolean(env.openaiApiKey),
    siteUrl: Boolean(env.siteUrl),
    supabaseAnonKey: Boolean(supabase.supabaseAnonKey),
    supabaseServiceRoleKey: Boolean(env.supabaseServiceRoleKey),
    supabaseUrl: Boolean(supabase.supabaseUrl),
    twilioConfigEncryptionSecret: Boolean(env.twilioConfigEncryptionSecret),
    twilioAuthToken: Boolean(env.twilioAuthToken),
    twilioMessagingServiceSid: Boolean(env.twilioMessagingServiceSid?.trim()),
    twilioPhoneNumber: Boolean(env.twilioPhoneNumber?.trim()),
    twilioSenderConfigured: hasConfiguredTwilioSender(env),
    twilioTestMode: Boolean(env.twilioWebhookTestMode),
  };
}

function tableComplete(detail: string): TableAuditItem {
  return { detail, label: "Verified", status: "complete", value: "Present" };
}

function tableMissing(detail: string, note?: string): TableAuditItem {
  return { detail, label: "Missing", note, status: "missing", value: "Not found" };
}

function tableError(detail: string): TableAuditItem {
  return { detail, label: "Error", status: "error", value: "Check schema" };
}

async function buildTableAudit() {
  const env = getBackendEnv();

  if (!env.supabaseServiceRoleKey || !env.supabaseUrl) {
    return requiredTables.map((table) =>
      tableMissing(
        `${table} could not be verified because the Supabase service role key or URL is missing.`,
        "Set SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL to inspect the live schema.",
      ),
    );
  }

  try {
    const admin = createSupabaseAdminClient();
    const checks = await Promise.all(
      requiredTables.map(async (table) => {
        const { error } = await admin.from(table).select("id").limit(1);

        if (!error) {
          return tableComplete(`${table} is present in the live schema.`);
        }

        const message = error.message?.toLowerCase() ?? "";
        if (message.includes("does not exist") || message.includes("relation") || message.includes("undefined table")) {
          return tableMissing(`${table} is missing from the live schema.`, "Apply the matching Supabase migration before going live.");
        }

        return tableError(`${table} could not be verified: ${error.message}`);
      }),
    );

    return checks;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return requiredTables.map((table) => tableError(`${table} could not be checked: ${message}`));
  }
}

function metricValue(metrics: ClinicDashboardData["metrics"], label: string) {
  return Number(metrics.find((metric) => metric.label === label)?.value ?? "0");
}

function buildRouteChecks(report: {
  dashboard: ClinicDashboardData;
  membershipExists: boolean;
  twilioHealth: TwilioSetupHealth | null;
  twilioPublicHealth: ReturnType<typeof getTwilioPublicHealth>;
}) {
  const dashboardReady = !report.dashboard.error;
  const onboardingReady = report.membershipExists;
  const twilioReady = Boolean(report.twilioHealth?.indicators.connected);
  const webhooksReady = report.twilioPublicHealth.connected && report.twilioPublicHealth.statuses.voiceWebhook === "ready";

  return [
    {
      detail: dashboardReady ? "Dashboard data loads from the live clinic schema." : report.dashboard.error ?? "Dashboard data is not available.",
      href: "/dashboard",
      label: "/dashboard",
      status: dashboardReady ? ("complete" as const) : ("missing" as const),
    },
    {
      detail: report.membershipExists ? "Clinic membership is active and authenticated users can reach patient data." : "Create a clinic workspace in onboarding first.",
      href: "/patients",
      label: "/patients",
      status: onboardingReady ? ("complete" as const) : ("missing" as const),
    },
    {
      detail: twilioReady ? "Twilio calls and recovery flows can read the clinic connection." : "Twilio is not connected for this clinic yet.",
      href: "/calls",
      label: "/calls",
      status: twilioReady ? ("complete" as const) : ("missing" as const),
    },
    {
      detail: webhooksReady ? "Onboarding can route through the Twilio setup flow." : "Twilio setup still needs webhook and auth configuration.",
      href: "/onboarding",
      label: "/onboarding",
      status: webhooksReady && onboardingReady ? ("complete" as const) : ("missing" as const),
    },
  ];
}

function buildStepChecks(input: {
  dashboard: ClinicDashboardData;
  env: ReturnType<typeof buildEnvChecks>;
  membershipExists: boolean;
  twilioHealth: TwilioSetupHealth | null;
  twilioPublicHealth: ReturnType<typeof getTwilioPublicHealth>;
}) {
  const twilio = input.twilioHealth;
  const env = input.env;
  const urls = input.twilioPublicHealth.webhookUrls;
  const totalCalls = metricValue(input.dashboard.metrics, "Total calls");
  const smsSent = metricValue(input.dashboard.metrics, "SMS sent");
  const hasClinicConfig = Boolean(twilio?.connection && isTwilioConnectionActive(twilio.connection));
  const hasVoiceNumber = Boolean(twilio?.connection?.voice_number);
  const voiceWebhookReady = input.twilioPublicHealth.statuses.voiceWebhook === "ready";
  const smsWebhookReady = input.twilioPublicHealth.statuses.smsWebhook === "ready";
  const openAiReady = env.openAiKey;
  const supabaseReady = env.siteUrl && env.supabaseAnonKey && env.supabaseServiceRoleKey && env.supabaseUrl;
  const healthReady = input.twilioPublicHealth.connected && !env.twilioTestMode;
  const testCallReady = totalCalls > 0;
  const testSmsReady = smsSent > 0;

  return [
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Open Twilio setup",
      detail: hasClinicConfig
        ? "ClinicFlow has an active Twilio connection row with an encrypted auth token."
        : twilio?.tableMissing
          ? "The twilio_connections table is missing from the live schema."
          : "Save the clinic Account SID and encrypted auth token in /integrations/twilio.",
      label: "Connect Twilio",
      status: hasClinicConfig ? "complete" : twilio?.connectionError || twilio?.tableMissing ? "error" : "missing",
      value: statusLabel(hasClinicConfig ? "complete" : twilio?.connectionError || twilio?.tableMissing ? "error" : "missing"),
    },
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Review voice number",
      detail: hasVoiceNumber
        ? `The active voice number is ${twilio?.connection?.voice_number ?? "configured"}.`
        : "Add the purchased Twilio phone number to the clinic connection row.",
      label: "Verify phone number",
      status: hasVoiceNumber ? "complete" : "missing",
      value: statusLabel(hasVoiceNumber ? "complete" : "missing"),
    },
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Copy voice webhook",
      detail: `Paste ${urls.voice} into Twilio Voice webhooks.`,
      label: "Configure Voice webhook",
      status: voiceWebhookReady ? "complete" : input.twilioPublicHealth.env.siteUrlConfigured ? "missing" : "error",
      value: statusLabel(voiceWebhookReady ? "complete" : input.twilioPublicHealth.env.siteUrlConfigured ? "missing" : "error"),
    },
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Copy SMS webhook",
      detail: `Paste ${urls.sms} into Twilio SMS webhooks.`,
      label: "Configure SMS webhook",
      status: smsWebhookReady ? "complete" : input.twilioPublicHealth.env.siteUrlConfigured ? "missing" : "error",
      value: statusLabel(smsWebhookReady ? "complete" : input.twilioPublicHealth.env.siteUrlConfigured ? "missing" : "error"),
    },
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Test a call",
      detail: testCallReady
        ? "At least one clinic call record exists, so the inbound-call flow has been exercised."
        : "Place a live call to the Twilio number or use the demo simulate-incoming-call button.",
      label: "Test inbound call",
      status: testCallReady ? "complete" : "missing",
      value: statusLabel(testCallReady ? "complete" : "missing"),
    },
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Test SMS flow",
      detail: testSmsReady
        ? "A live SMS event exists, so recovery replies can be tracked."
        : "Send a real SMS reply to the clinic number or use the demo simulate-SMS button.",
      label: "Test SMS",
      status: testSmsReady ? "complete" : "missing",
      value: statusLabel(testSmsReady ? "complete" : "missing"),
    },
    {
      actionHref: "/integrations/twilio",
      actionLabel: "Configure OpenAI",
      detail: openAiReady
        ? "OPENAI_API_KEY is configured for call summaries and recommendations."
        : "Set OPENAI_API_KEY in the production environment to enable summaries.",
      label: "Configure OpenAI",
      status: openAiReady ? "complete" : "missing",
      value: statusLabel(openAiReady ? "complete" : "missing"),
    },
    {
      actionHref: "/settings",
      actionLabel: "Check Supabase env",
      detail: supabaseReady
        ? "Supabase URL, anon key, and service role key are all configured."
        : "Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY.",
      label: "Verify Supabase",
      status: supabaseReady ? "complete" : "missing",
      value: statusLabel(supabaseReady ? "complete" : "missing"),
    },
    {
      actionHref: "/api/system/health",
      actionLabel: "Open health endpoint",
      detail: healthReady
        ? "The health endpoint is returning the production webhook URLs and Twilio is ready for live signatures."
        : "Set NEXT_PUBLIC_SITE_URL and TWILIO_WEBHOOK_TEST_MODE=false, then confirm /api/system/health returns the production URLs.",
      label: "Run Health Check",
      status: healthReady ? "complete" : env.twilioTestMode ? "missing" : "error",
      value: statusLabel(healthReady ? "complete" : env.twilioTestMode ? "missing" : "error"),
    },
    {
      actionHref: "/dashboard",
      actionLabel: "Go to dashboard",
      detail:
        hasClinicConfig && hasVoiceNumber && voiceWebhookReady && smsWebhookReady && testCallReady && testSmsReady && openAiReady && supabaseReady && healthReady
          ? "All critical production dependencies are green."
          : "One or more production dependencies still need attention.",
      label: "Platform Ready",
      status:
        hasClinicConfig && hasVoiceNumber && voiceWebhookReady && smsWebhookReady && testCallReady && testSmsReady && openAiReady && supabaseReady && healthReady
          ? "complete"
          : "missing",
      value: statusLabel(
        hasClinicConfig && hasVoiceNumber && voiceWebhookReady && smsWebhookReady && testCallReady && testSmsReady && openAiReady && supabaseReady && healthReady
          ? "complete"
          : "missing",
      ),
    },
  ] satisfies ReadinessStep[];
}

function summarizeBlockers(report: {
  env: ReturnType<typeof buildEnvChecks>;
  membershipExists: boolean;
  steps: ReadinessStep[];
  tables: TableAuditItem[];
  twilioHealth: TwilioSetupHealth | null;
}) {
  const blockers = new Set<string>();

  if (!report.membershipExists) {
    blockers.add("Complete clinic onboarding so the authenticated user has an active clinic_users row.");
  }
  if (!report.env.supabaseUrl) blockers.add("Set NEXT_PUBLIC_SUPABASE_URL.");
  if (!report.env.supabaseAnonKey) blockers.add("Set NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  if (!report.env.supabaseServiceRoleKey) blockers.add("Set SUPABASE_SERVICE_ROLE_KEY.");
  if (!report.env.siteUrl) blockers.add("Set NEXT_PUBLIC_SITE_URL to the production domain.");
  if (!report.env.twilioConfigEncryptionSecret) blockers.add("Set TWILIO_CONFIG_ENCRYPTION_SECRET so clinic Twilio secrets can be encrypted and decrypted.");
  if (report.env.twilioTestMode) blockers.add("Set TWILIO_WEBHOOK_TEST_MODE=false before live call handling.");
  if (!report.env.openAiKey) blockers.add("Set OPENAI_API_KEY for call summaries and recommendations.");
  if (!report.env.twilioSenderConfigured) {
    blockers.add("Set either TWILIO_MESSAGING_SERVICE_SID or TWILIO_PHONE_NUMBER for outbound SMS recovery.");
  }
  if (!report.twilioHealth?.connection) {
    blockers.add("Create the clinic Twilio connection row with Account SID, auth token, voice number, and forwarding number.");
  }

  report.tables
    .filter((item) => item.status !== "complete")
    .slice(0, 3)
    .forEach((item) => blockers.add(item.detail));

  report.steps
    .filter((step) => step.status !== "complete")
    .slice(0, 5)
    .forEach((step) => blockers.add(`${step.label}: ${step.detail}`));

  return Array.from(blockers);
}

export async function buildProductionReadinessReport(input: {
  baseUrl?: string | null;
  user: Pick<User, "email" | "id" | "user_metadata"> | null;
}) {
  const env = buildEnvChecks();
  const deploymentMode = getDeploymentMode();
  const membership = input.user ? await getActiveClinicMembershipForUser(input.user) : null;
  const dashboard = await getClinicDashboardData(input.user);
  const publicHealth = getTwilioPublicHealth(input.baseUrl);
  const setupHealth = membership && env.supabaseServiceRoleKey ? await getTwilioSetupHealthForClinic(membership.clinic_id, { baseUrl: input.baseUrl }) : null;
  const tables = await buildTableAudit();
  const steps = buildStepChecks({
    dashboard,
    env,
    membershipExists: Boolean(membership),
    twilioHealth: setupHealth,
    twilioPublicHealth: publicHealth,
  });
  const blockers = summarizeBlockers({
    env,
    membershipExists: Boolean(membership),
    steps,
    tables,
    twilioHealth: setupHealth,
  });

  return {
    blockers,
    clinic: {
      id: membership?.clinic_id ?? null,
      membershipStatus: membership?.status ?? "missing",
      role: membership?.role ?? null,
    },
    deploymentMode,
    env,
    lastCheckedAt: new Date().toISOString(),
    routes: buildRouteChecks({
      dashboard,
      membershipExists: Boolean(membership),
      twilioHealth: setupHealth,
      twilioPublicHealth: publicHealth,
    }),
    steps,
    tables,
    twilio: {
      publicHealth,
      setupHealth,
    },
    urls: buildWebhookUrls(input.baseUrl),
  } satisfies ProductionReadinessReport;
}

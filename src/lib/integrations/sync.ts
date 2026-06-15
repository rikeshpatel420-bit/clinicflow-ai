import type { IntegrationStatus, SyncJobStatus } from "@/lib/integrations/types";

export function shouldRetry(status: SyncJobStatus, retryCount: number) {
  return (status === "failed" || status === "retrying") && retryCount < 3;
}

export function getConnectionHealth(status: IntegrationStatus, score: number) {
  if (status === "error" || score < 50) return "critical";
  if (status === "degraded" || score < 75) return "attention";
  if (status === "paused") return "paused";
  return "healthy";
}

export function buildExternalRef(provider: string, externalId: string) {
  return `${provider}:${externalId}`;
}


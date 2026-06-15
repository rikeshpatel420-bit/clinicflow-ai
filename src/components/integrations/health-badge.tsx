import type { IntegrationStatus, SyncJobStatus } from "@/lib/integrations/types";

const integrationTone: Record<IntegrationStatus, string> = {
  connected: "bg-[#e8f8f4] text-[#087968]",
  degraded: "bg-[#fef9c3] text-[#854d0e]",
  error: "bg-[#fee2e2] text-[#991b1b]",
  not_connected: "bg-[#eef4f2] text-[#65736f]",
  paused: "bg-[#fff7ed] text-[#9a3412]",
};

const syncTone: Record<SyncJobStatus, string> = {
  completed: "bg-[#e8f8f4] text-[#087968]",
  failed: "bg-[#fee2e2] text-[#991b1b]",
  queued: "bg-[#eef4f2] text-[#65736f]",
  retrying: "bg-[#fef9c3] text-[#854d0e]",
  running: "bg-[#ecfdf5] text-[#047857]",
};

export function IntegrationStatusBadge({ status }: { status: IntegrationStatus }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${integrationTone[status]}`}>{status.replace("_", " ")}</span>;
}

export function SyncStatusBadge({ status }: { status: SyncJobStatus }) {
  return <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${syncTone[status]}`}>{status}</span>;
}


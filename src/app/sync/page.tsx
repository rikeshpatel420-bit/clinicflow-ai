import { redirect } from "next/navigation";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { SyncTable } from "@/components/integrations/sync-table";
import { getProviderName } from "@/lib/integrations/registry";
import { integrationDemo } from "@/lib/integrations/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntegrationShell
      active="/sync"
      eyebrow="Sync monitoring"
      title="Import, export, and webhook operations"
      description="Simulated sync dashboard for job status, retries, webhook ingestion, failures, and audit-safe data movement."
    >
      <SyncTable jobs={integrationDemo.syncJobs} />

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Webhook event ingestion</h2>
          <div className="mt-4 grid gap-3">
            {integrationDemo.webhookEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-[#10201d]">{getProviderName(event.provider)}</p>
                  <span className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-[#087968] ring-1 ring-[#dce6e3]">{event.status}</span>
                </div>
                <p className="mt-2 text-sm text-[#65736f]">{event.eventType} / {event.receivedAt}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-lg bg-[#10201d] p-5 text-white shadow-sm">
          <p className="text-sm font-semibold text-[#72e5d3]">Failure handling</p>
          <h2 className="mt-3 text-3xl font-semibold">Retry-safe by default</h2>
          <p className="mt-4 text-sm leading-6 text-white/65">
            Sync jobs are modeled with retry counts, failure totals, external IDs, and audit summaries so production connectors can fail safely without corrupting clinic records.
          </p>
        </article>
      </section>
    </IntegrationShell>
  );
}


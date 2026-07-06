import { redirect } from "next/navigation";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { MappingList } from "@/components/integrations/mapping-list";
import { ProviderCard } from "@/components/integrations/provider-card";
import { integrationDemo } from "@/lib/integrations/data";
import { calendarProviderRegistry } from "@/lib/integrations/calendar/registry";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <IntegrationShell
      active="/integrations"
      eyebrow="Integration architecture"
      title="Clinic software connector hub"
      description="Provider-neutral connector foundation for practice systems, CRM, communications, calendars, webhooks, and audit-safe sync."
    >
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {integrationDemo.metrics.map((metric) => (
          <article key={metric.label} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-[#65736f]">{metric.label}</p>
            <p className="mt-3 text-3xl font-semibold text-[#10201d]">{metric.value}</p>
            <p className="mt-2 text-sm font-semibold text-[#087968]">{metric.note}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {integrationDemo.providers.map((provider) => (
          <ProviderCard
            key={provider.key}
            provider={provider}
            connection={integrationDemo.connections.find((connection) => connection.provider === provider.key)}
          />
        ))}
      </section>

      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 border-b border-[#edf2f0] pb-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#10201d]">Calendar provider adapters</h2>
            <p className="mt-1 text-sm text-[#65736f]">
              The booking engine uses one shared API for availability, booking, updates, and cancellation across practice-management and calendar providers.
            </p>
          </div>
          <span className="rounded-full bg-[#f7faf9] px-3 py-1.5 text-xs font-semibold text-[#52615d]">
            Mocked implementations ready
          </span>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {calendarProviderRegistry.map((provider) => (
            <article key={provider.id} className="rounded-2xl border border-[#edf2f0] bg-[#fbfdfc] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#65736f]">{provider.kind.replace("_", " ")}</p>
              <h3 className="mt-2 text-base font-semibold text-[#10201d]">{provider.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#65736f]">{provider.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-[#087968]">
                {provider.supportedOperations.map((operation) => (
                  <span key={operation} className="rounded-full bg-[#e8f8f4] px-2.5 py-1">
                    {operation}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[#10201d]">Data mapping layer</h2>
        <p className="mt-2 text-sm text-[#65736f]">External ID relationships and safe transforms before clinic-scoped records are updated.</p>
        <div className="mt-5">
          <MappingList mappings={integrationDemo.fieldMappings} />
        </div>
      </section>
    </IntegrationShell>
  );
}


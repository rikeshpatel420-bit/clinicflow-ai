import { redirect } from "next/navigation";
import { IntegrationShell } from "@/components/integrations/integration-shell";
import { MappingList } from "@/components/integrations/mapping-list";
import { ProviderCard } from "@/components/integrations/provider-card";
import { integrationDemo } from "@/lib/integrations/data";
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
        <h2 className="text-lg font-semibold text-[#10201d]">Data mapping layer</h2>
        <p className="mt-2 text-sm text-[#65736f]">External ID relationships and safe transforms before clinic-scoped records are updated.</p>
        <div className="mt-5">
          <MappingList mappings={integrationDemo.fieldMappings} />
        </div>
      </section>
    </IntegrationShell>
  );
}


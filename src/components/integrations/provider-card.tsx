import { IntegrationStatusBadge } from "@/components/integrations/health-badge";
import type { IntegrationConnection, ProviderDefinition } from "@/lib/integrations/types";

export function ProviderCard({
  provider,
  connection,
}: {
  provider: ProviderDefinition;
  connection?: IntegrationConnection;
}) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#087968]">{provider.category.replace("_", " ")}</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{provider.name}</h2>
        </div>
        <IntegrationStatusBadge status={connection?.status ?? "not_connected"} />
      </div>
      <p className="mt-4 text-sm leading-6 text-[#65736f]">{provider.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {provider.supportedObjects.map((object) => (
          <span key={object} className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">
            {object}
          </span>
        ))}
      </div>
      {connection ? (
        <div className="mt-5 rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4 text-sm">
          <p className="font-semibold text-[#10201d]">{connection.externalAccountLabel}</p>
          <p className="mt-1 text-[#65736f]">Health {connection.healthScore}% / Last sync {connection.lastSyncAt}</p>
        </div>
      ) : null}
    </article>
  );
}


import { redirect } from "next/navigation";
import { CommunicationMetrics } from "@/components/communications/communication-metrics";
import { CommunicationShell } from "@/components/communications/communication-shell";
import { CommunicationTimeline } from "@/components/communications/communication-timeline";
import { communicationProviders } from "@/lib/communications/providers";
import { engagementDemo } from "@/lib/communications/engagement-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function CommunicationsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <CommunicationShell
      active="/communications"
      eyebrow="Communication infrastructure"
      title="Omnichannel engagement center"
      description="Unified architecture for inbox persistence, channel abstraction, conversation timelines, reminders, campaigns, and audit-safe communication history."
    >
      <CommunicationMetrics items={engagementDemo.metrics} />
      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Channel providers</h2>
          <div className="mt-4 grid gap-3">
            {communicationProviders.map((provider) => (
              <div key={provider.channel} className="rounded-lg border border-[#edf2f0] bg-[#fbfdfc] p-4">
                <p className="font-semibold text-[#10201d]">{provider.channel}</p>
                <p className="mt-1 text-sm text-[#65736f]">{provider.provider} / test mode {provider.testMode ? "on" : "off"}</p>
              </div>
            ))}
          </div>
        </article>
        <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-[#10201d]">Communication audit timeline</h2>
          <div className="mt-4">
            <CommunicationTimeline items={engagementDemo.timeline} />
          </div>
        </article>
      </section>
    </CommunicationShell>
  );
}


import { redirect } from "next/navigation";
import { CommunicationMetrics } from "@/components/communications/communication-metrics";
import { CommunicationShell } from "@/components/communications/communication-shell";
import { ThreadCard } from "@/components/communications/thread-card";
import { engagementDemo } from "@/lib/communications/engagement-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EngagementPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <CommunicationShell
      active="/engagement"
      eyebrow="Lead engagement scoring"
      title="Patient conversion engagement"
      description="Deterministic scoring for replies, booking intent, follow-up timing, and estimated patient value."
    >
      <CommunicationMetrics items={engagementDemo.metrics} />
      <section className="grid gap-6 md:grid-cols-3">
        {engagementDemo.threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </section>
    </CommunicationShell>
  );
}


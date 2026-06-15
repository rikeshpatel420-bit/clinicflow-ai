import { redirect } from "next/navigation";
import { CommunicationShell } from "@/components/communications/communication-shell";
import { ThreadCard } from "@/components/communications/thread-card";
import { engagementDemo } from "@/lib/communications/engagement-data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function ThreadsPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <CommunicationShell
      active="/threads"
      eyebrow="Conversation threading"
      title="Unified patient threads"
      description="Thread-level ownership, internal notes, tags, channel context, and safe follow-up state."
    >
      <section className="grid gap-6 md:grid-cols-3">
        {engagementDemo.threads.map((thread) => (
          <ThreadCard key={thread.id} thread={thread} />
        ))}
      </section>
    </CommunicationShell>
  );
}


import { redirect } from "next/navigation";
import { RevenueOpsShell } from "@/components/revenue-ops/revenue-ops-shell";
import { TaskQueue } from "@/components/revenue-ops/task-queue";
import { revenueOpsDemo } from "@/lib/revenue-ops/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <RevenueOpsShell
      active="/tasks"
      eyebrow="Front-desk task queues"
      title="Daily revenue work queue"
      description="Prioritised, value-aware task management for callback, treatment recovery, reactivation, and cancellation workflows."
    >
      <TaskQueue tasks={revenueOpsDemo.tasks} />
    </RevenueOpsShell>
  );
}


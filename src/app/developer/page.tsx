import { redirect } from "next/navigation";
import { PlatformShell } from "@/components/platform/platform-shell";
import { globalSearchFilters } from "@/lib/platform/search";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function DeveloperPage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <PlatformShell
      active="/developer"
      eyebrow="Developer framework"
      title="API readiness and internal command framework"
      description="Foundations for webhooks, commands, global search, keyboard shortcuts, tables, filters, drawers, and reusable data providers."
    >
      <section className="grid gap-4 md:grid-cols-3">
        {globalSearchFilters.map((filter) => (
          <article key={filter.key} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-[#087968]">{filter.entity}</p>
            <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{filter.label}</h2>
          </article>
        ))}
      </section>
    </PlatformShell>
  );
}


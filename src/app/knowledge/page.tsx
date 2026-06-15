import { redirect } from "next/navigation";
import { AiShell } from "@/components/ai/ai-shell";
import { aiDemo } from "@/lib/ai/data";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");

  return (
    <AiShell
      active="/knowledge"
      eyebrow="Clinic knowledge base"
      title="Approved AI knowledge placeholders"
      description="Structured clinic knowledge areas that will later constrain receptionist answers and reduce unsafe or off-brand replies."
    >
      <section className="grid gap-6 md:grid-cols-2">
        {aiDemo.knowledgeBase.map((item) => (
          <article key={item.title} className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#10201d]">{item.title}</h2>
              <span className="rounded-md bg-[#fef9c3] px-2.5 py-1 text-xs font-semibold text-[#854d0e]">{item.status}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#65736f]">{item.content}</p>
          </article>
        ))}
      </section>
    </AiShell>
  );
}


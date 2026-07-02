import { redirect } from "next/navigation";
import { AiShell } from "@/components/ai/ai-shell";
import { KnowledgeUploadPanel } from "@/components/knowledge/knowledge-upload-panel";
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
      title="Knowledge centre"
      description="Upload the policies, services, and emergency rules that shape the receptionist's replies."
    >
      <KnowledgeUploadPanel />

      <section className="grid gap-6 md:grid-cols-2">
        {aiDemo.knowledgeBase.map((item) => (
          <article key={item.title} className="rounded-[24px] border border-[#dce6e3] bg-white p-5 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#10201d]">{item.title}</h2>
              <span className="rounded-full border border-[#f3d29c] bg-[#fff8eb] px-3 py-1 text-xs font-semibold text-[#9a5c00]">{item.status}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#65736f]">{item.content}</p>
          </article>
        ))}
      </section>
    </AiShell>
  );
}


import { redirect } from "next/navigation";
import { AiShell } from "@/components/ai/ai-shell";
import { KnowledgeUploadPanel } from "@/components/knowledge/knowledge-upload-panel";
import { getActiveClinicMembershipForUser } from "@/lib/auth/clinic-workspace";
import { getClinicSettingsSnapshot } from "@/lib/settings/store";
import { getSupabaseEnv } from "@/lib/supabase/env";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function KnowledgePage() {
  const { isSupabaseConfigured } = getSupabaseEnv();
  const user = await getCurrentUser();
  if (isSupabaseConfigured && !user) redirect("/login");
  const membership = user ? await getActiveClinicMembershipForUser(user) : null;
  const snapshot = membership ? await getClinicSettingsSnapshot(membership.clinic_id) : null;
  const knowledge = snapshot?.clinic.business_configuration.knowledgeBase;

  return (
    <AiShell
      active="/knowledge"
      eyebrow="Clinic knowledge base"
      title="Knowledge centre"
      description="Upload the policies, services, and emergency rules that shape the receptionist's replies."
    >
      <KnowledgeUploadPanel />

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Questions to ask",
            content: knowledge?.questionsToAsk.join(" / ") || "No questions saved yet.",
            status: String(knowledge?.questionsToAsk.length ?? 0),
          },
          {
            title: "Required customer information",
            content: knowledge?.requiredCustomerInformation.join(" / ") || "No customer fields saved yet.",
            status: String(knowledge?.requiredCustomerInformation.length ?? 0),
          },
          {
            title: "Emergency rules",
            content: knowledge?.summary || "No emergency rules saved yet.",
            status: String(snapshot?.clinic.launch_state.score ?? 0),
          },
          {
            title: "Document references",
            content: knowledge?.documents.join(" / ") || "No documents saved yet.",
            status: String(knowledge?.documents.length ?? 0),
          },
        ].map((item) => (
          <article key={item.title} className="rounded-[24px] border border-[#dce6e3] bg-white p-5 shadow-[0_18px_60px_rgba(16,33,29,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-lg font-semibold text-[#10201d]">{item.title}</h2>
              <span className="rounded-full border border-[#c8eee6] bg-[#f7fffd] px-3 py-1 text-xs font-semibold text-[#087968]">{item.status}</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#65736f]">{item.content}</p>
          </article>
        ))}
      </section>
    </AiShell>
  );
}


import { LoadingPanel } from "@/components/ui/loading-panel";

export default function ConversationLoading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] p-6">
      <section className="mx-auto max-w-5xl">
        <LoadingPanel rows={4} />
      </section>
    </main>
  );
}

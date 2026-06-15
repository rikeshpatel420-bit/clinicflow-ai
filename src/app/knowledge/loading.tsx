import { LoadingPanel } from "@/components/ui/loading-panel";

export default function KnowledgeLoading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] p-6">
      <LoadingPanel rows={4} />
    </main>
  );
}


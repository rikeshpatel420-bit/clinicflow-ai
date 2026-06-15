import { LoadingPanel } from "@/components/ui/loading-panel";

export default function EscalationsLoading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] p-6">
      <LoadingPanel rows={4} />
    </main>
  );
}


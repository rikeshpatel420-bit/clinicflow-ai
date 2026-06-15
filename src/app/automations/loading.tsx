import { LoadingPanel } from "@/components/ui/loading-panel";

export default function AutomationsLoading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] p-6">
      <section className="mx-auto max-w-7xl">
        <LoadingPanel rows={4} />
      </section>
    </main>
  );
}

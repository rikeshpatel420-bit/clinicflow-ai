import { LoadingPanel } from "@/components/ui/loading-panel";

export default function SettingsLoading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] p-6">
      <LoadingPanel rows={5} />
    </main>
  );
}


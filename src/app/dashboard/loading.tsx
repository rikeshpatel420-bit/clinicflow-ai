export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] p-6 text-[#17211f]">
      <section className="mx-auto grid max-w-7xl gap-6">
        <div className="h-24 animate-pulse rounded-lg bg-white" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-32 animate-pulse rounded-lg bg-white" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-white" />
      </section>
    </main>
  );
}

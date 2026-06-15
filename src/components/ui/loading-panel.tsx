export function LoadingPanel({ rows = 3 }: { rows?: number }) {
  return (
    <section aria-busy="true" aria-label="Loading content" className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
      <div className="h-6 w-48 animate-pulse rounded-md bg-[#edf2f0]" />
      <div className="mt-6 grid gap-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="h-16 animate-pulse rounded-md bg-[#edf2f0]" />
        ))}
      </div>
    </section>
  );
}

export default function Loading() {
  return (
    <main className="min-h-screen bg-[#eef4f2] text-[#17211f]">
      <div className="mx-auto grid max-w-[92rem] gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[28px] border border-[#dce6e3] bg-[#10201d] p-8">
          <div className="h-4 w-40 animate-pulse rounded-full bg-white/10" />
          <div className="mt-4 h-10 w-3/4 animate-pulse rounded-2xl bg-white/10" />
          <div className="mt-4 h-4 w-2/3 animate-pulse rounded-full bg-white/10" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[22px] border border-[#dce6e3] bg-white" />
          ))}
        </div>
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="h-[420px] animate-pulse rounded-[28px] border border-[#dce6e3] bg-white" />
          <div className="h-[420px] animate-pulse rounded-[28px] border border-[#dce6e3] bg-white" />
        </div>
      </div>
    </main>
  );
}

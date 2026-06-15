export default function OnboardingLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6 py-12">
      <section className="w-full max-w-2xl rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <div className="h-10 w-40 animate-pulse rounded-md bg-[#edf2f0]" />
        <div className="mt-10 h-8 w-3/4 animate-pulse rounded-md bg-[#edf2f0]" />
        <div className="mt-4 h-20 animate-pulse rounded-md bg-[#edf2f0]" />
        <div className="mt-8 grid gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-md bg-[#edf2f0]" />
          ))}
        </div>
      </section>
    </main>
  );
}

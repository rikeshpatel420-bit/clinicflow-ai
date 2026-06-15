"use client";

export default function RecoveryError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef4f2] px-6 text-[#17211f]">
      <section className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <h1 className="text-3xl font-semibold text-[#10201d]">Could not load recovery pipeline</h1>
        <button type="button" onClick={reset} className="mt-6 rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white">
          Try again
        </button>
      </section>
    </main>
  );
}

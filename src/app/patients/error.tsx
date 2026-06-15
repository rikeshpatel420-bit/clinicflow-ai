"use client";

export default function PatientsError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef4f2] px-6 py-12 text-[#17211f]">
      <section className="w-full max-w-lg rounded-lg border border-red-200 bg-white p-8 shadow-xl shadow-slate-900/5">
        <p className="text-sm font-semibold text-red-700">Patient CRM error</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Could not load patients</h1>
        <p className="mt-3 leading-7 text-[#65736f]">
          Try again, then check Supabase configuration if this continues.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
        >
          Try again
        </button>
      </section>
    </main>
  );
}

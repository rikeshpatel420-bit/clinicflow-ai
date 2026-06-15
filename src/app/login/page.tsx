import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <div className="grid min-h-screen lg:grid-cols-[0.92fr_1.08fr]">
        <section className="flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
            <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
              <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">
                CF
              </span>
              ClinicFlow AI
            </Link>

            <div className="mt-10">
              <p className="text-sm font-semibold text-[#087968]">Secure clinic access</p>
              <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Log in to your workspace</h1>
              <p className="mt-3 leading-7 text-[#65736f]">
                Supabase authentication will connect here in the next implementation step.
              </p>
            </div>

            <form className="mt-8 grid gap-5">
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Email address
                <input
                  type="email"
                  placeholder="you@clinic.com"
                  className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                <span className="flex items-center justify-between gap-3">
                  Password
                  <Link href="/forgot-password" className="text-xs font-semibold text-[#087968] hover:text-[#0a8f7b]">
                    Forgot?
                  </Link>
                </span>
                <input
                  type="password"
                  placeholder="Enter your password"
                  className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
                />
              </label>
              <button
                type="button"
                className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
              >
                Continue
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/signup" className="font-medium text-[#65736f] hover:text-[#10201d]">
                Create account
              </Link>
              <Link href="/dashboard" className="font-semibold text-[#087968] hover:text-[#0a8f7b]">
                Preview dashboard
              </Link>
            </div>
          </div>
        </section>

        <section className="hidden bg-[#10201d] p-8 text-white lg:block">
          <div className="flex h-full flex-col justify-between rounded-lg border border-white/10 bg-white/[0.04] p-8">
            <div>
              <p className="text-sm font-semibold text-[#72e5d3]">Clinic operations preview</p>
              <h2 className="mt-4 max-w-xl text-4xl font-semibold leading-tight">
                Recovery workflows, patient context, and appointment movement in one place.
              </h2>
            </div>
            <div className="grid gap-4">
              {["14 missed calls queued", "8 recovered conversations", "6 appointments booked today"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-sm text-white/60">Live signal</p>
                  <p className="mt-2 text-xl font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

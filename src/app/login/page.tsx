import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

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
                Access your clinic workspace with Supabase email and password authentication.
              </p>
            </div>

            <form action={loginAction} className="mt-8 grid gap-5">
              <input type="hidden" name="next" value={params?.next ?? "/dashboard"} />
              <label className="grid gap-2 text-sm font-medium text-[#394642]">
                Email address
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="you@clinic.com"
                  autoComplete="email"
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
                  name="password"
                  type="password"
                  required
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
                />
              </label>
              {params?.error ? (
                <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                  {params.error}
                </p>
              ) : null}
              {params?.message ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800">
                  {params.message}
                </p>
              ) : null}
              <button
                type="submit"
                className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
              >
                Continue
              </button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
              <Link href="/signup" className="font-medium text-[#65736f] hover:text-[#10201d]">
                Create account
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
              {["Tenant isolation", "Owner-led onboarding", "Clinic-scoped dashboard"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/[0.06] p-5">
                  <p className="text-sm text-white/60">Production auth</p>
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

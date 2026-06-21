import Link from "next/link";
import { signupAction } from "@/app/auth/actions";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

type SignupPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/signup" variant="public" />

      <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 sm:px-6">
      <section className="w-full max-w-md rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">
            CF
          </span>
          <span className="text-[#10201d]">ClinicFlow AI</span>
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold text-[#087968]">Create workspace</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Start your clinic account</h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#65736f]">
            Create a Supabase account and your first clinic workspace in one step.
          </p>
        </div>

        <form action={signupAction} className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Clinic name
            <input
              name="clinicName"
              type="text"
              required
              placeholder="Your clinic name"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Owner name
            <input
              name="fullName"
              type="text"
              required
              placeholder="Your full name"
              autoComplete="name"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
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
            Password
            <input
              name="password"
              type="password"
              required
              minLength={8}
              placeholder="Create a password"
              autoComplete="new-password"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          {params?.error ? (
            <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
              {params.error}
            </p>
          ) : null}
          <button
            type="submit"
            className="rounded-full bg-[#10201d] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20332f]"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-sm text-[#65736f]">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#087968] hover:text-[#0a8f7b]">
            Log in
          </Link>
        </p>
      </section>

      </section>

      <SiteFooter />
    </main>
  );
}

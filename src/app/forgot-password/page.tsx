import Link from "next/link";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/forgot-password" variant="public" />

      <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-md rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">
            CF
          </span>
          <span className="text-[#10201d]">ClinicFlow AI</span>
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold text-[#087968]">Password recovery</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Reset your password</h1>
          <p className="mt-3 text-[0.98rem] leading-7 text-[#65736f]">
            Enter the email linked to your clinic workspace. Supabase reset email handling
            will connect in the next auth step.
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
          <button
            type="button"
            className="rounded-full bg-[#10201d] px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20332f]"
          >
            Send reset link
          </button>
        </form>

        <Link href="/login" className="mt-6 block text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Back to login
        </Link>
      </section>
      </section>

      <SiteFooter />
    </main>
  );
}

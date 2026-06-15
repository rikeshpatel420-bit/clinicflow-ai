import Link from "next/link";

export default function SignupPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faf9] px-6 py-12 text-[#17211f]">
      <section className="w-full max-w-md rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
        <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
          <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">
            CF
          </span>
          ClinicFlow AI
        </Link>

        <div className="mt-10">
          <p className="text-sm font-semibold text-[#087968]">Create workspace</p>
          <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Start your clinic account</h1>
          <p className="mt-3 leading-7 text-[#65736f]">
            This form is ready for Supabase signup actions in the next auth step.
          </p>
        </div>

        <form className="mt-8 grid gap-5">
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Clinic name
            <input
              type="text"
              placeholder="Harley Street Dental"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Email address
            <input
              type="email"
              placeholder="you@clinic.com"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#394642]">
            Password
            <input
              type="password"
              placeholder="Create a password"
              className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
            />
          </label>
          <button
            type="button"
            className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f]"
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
        <Link href="/onboarding" className="mt-4 block text-sm font-semibold text-[#087968] hover:text-[#0a8f7b]">
          Preview onboarding flow
        </Link>
      </section>
    </main>
  );
}

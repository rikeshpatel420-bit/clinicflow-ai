import Link from "next/link";
import { redirect } from "next/navigation";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { SiteFooter } from "@/components/navigation/site-footer";
import { SiteHeader } from "@/components/navigation/site-header";
import { hasPasswordRecoveryContext } from "@/lib/auth/recovery-context";
import { getCurrentUser } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const user = await getCurrentUser();
  if (!user || !(await hasPasswordRecoveryContext(user.id))) {
    redirect(
      "/forgot-password?error=This+password-reset+session+is+invalid+or+has+expired.+Request+a+new+link.",
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf9] text-[#17211f]">
      <SiteHeader activePath="/update-password" variant="public" />
      <section className="flex min-h-[calc(100vh-5rem)] items-center justify-center px-4 py-12 sm:px-6">
        <section className="w-full max-w-md rounded-lg border border-[#dce6e3] bg-white p-8 shadow-xl shadow-slate-900/5">
          <Link href="/" className="flex w-fit items-center gap-3 font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[#10201d] text-sm text-white">CF</span>
            <span className="text-[#10201d]">ClinicFlow AI</span>
          </Link>
          <div className="mt-10">
            <p className="text-sm font-semibold text-[#087968]">Secure account recovery</p>
            <h1 className="mt-3 text-3xl font-semibold text-[#10201d]">Choose a new password</h1>
            <p className="mt-3 text-[0.98rem] leading-7 text-[#65736f]">
              Set a strong new password for your ClinicFlow workspace.
            </p>
          </div>
          <UpdatePasswordForm />
        </section>
      </section>
      <SiteFooter />
    </main>
  );
}

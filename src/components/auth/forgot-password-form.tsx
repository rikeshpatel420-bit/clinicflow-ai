"use client";

import { useActionState, useEffect, useState } from "react";
import { requestPasswordResetAction } from "@/app/auth/actions";
import { initialPasswordResetState } from "@/lib/auth/flows";

const RESEND_DELAY_SECONDS = 60;

function ResendButton({ pending }: { pending: boolean }) {
  const [resendIn, setResendIn] = useState(RESEND_DELAY_SECONDS);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  return (
    <button
      type="submit"
      disabled={pending || resendIn > 0}
      className="rounded-full bg-[#10201d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20332f] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Sending secure link..." : resendIn > 0 ? `Resend link in ${resendIn}s` : "Resend link"}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialPasswordResetState);

  return (
    <form action={action} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-[#394642]">
        Email address
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          placeholder="you@clinic.com"
          aria-invalid={Boolean(state.fieldError)}
          className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
        />
      </label>

      {state.fieldError ? <p className="text-sm font-medium text-red-700">{state.fieldError}</p> : null}
      {state.message ? (
        <p
          aria-live="polite"
          className={`rounded-md border p-3 text-sm font-medium ${
            state.status === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      {state.status === "success" ? (
        <ResendButton key={state.requestAcceptedAt} pending={pending} />
      ) : (
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-[#10201d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20332f] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? "Sending secure link..." : "Send reset link"}
        </button>
      )}
    </form>
  );
}

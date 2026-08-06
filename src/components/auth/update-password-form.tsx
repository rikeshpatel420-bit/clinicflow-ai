"use client";

import { useActionState } from "react";
import { updatePasswordAction } from "@/app/auth/actions";
import { initialPasswordUpdateState } from "@/lib/auth/flows";
import { PASSWORD_REQUIREMENTS } from "@/lib/auth/validation";

export function UpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialPasswordUpdateState);

  return (
    <form action={action} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-[#394642]">
        New password
        <input
          name="password"
          type="password"
          required
          minLength={PASSWORD_REQUIREMENTS.minLength}
          autoComplete="new-password"
          className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#394642]">
        Confirm new password
        <input
          name="confirmation"
          type="password"
          required
          minLength={PASSWORD_REQUIREMENTS.minLength}
          autoComplete="new-password"
          className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
        />
      </label>

      <p className="text-sm leading-6 text-[#65736f]">{PASSWORD_REQUIREMENTS.description}</p>
      {state.fieldError ? <p className="text-sm font-medium text-red-700">{state.fieldError}</p> : null}
      {state.message ? (
        <p aria-live="polite" className="rounded-md border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#10201d] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#20332f] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Updating password..." : "Update password"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createClinicAction, initialOnboardingState } from "./actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f] disabled:cursor-not-allowed disabled:bg-[#8a9995]"
    >
      {pending ? "Creating clinic..." : "Create clinic workspace"}
    </button>
  );
}

export function OnboardingForm() {
  const [state, formAction] = useActionState(createClinicAction, initialOnboardingState);

  return (
    <form action={formAction} className="mt-8 grid gap-5">
      <label className="grid gap-2 text-sm font-medium text-[#394642]">
        Clinic name
        <input
          name="clinicName"
          type="text"
          required
          placeholder="Demo Dental Clinic"
          className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
        />
      </label>
      <label className="grid gap-2 text-sm font-medium text-[#394642]">
        Owner name
        <input
          name="fullName"
          type="text"
          required
          placeholder="Rikesh Shah"
          className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
        />
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Clinic phone
          <input
            name="phone"
            type="tel"
            placeholder="+44 20 7946 0000"
            className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-[#394642]">
          Timezone
          <input
            name="timezone"
            type="text"
            defaultValue="Europe/London"
            className="rounded-md border border-[#cdd8d5] bg-[#fbfdfc] px-3 py-3 text-[#10201d] outline-none focus:border-[#0a8f7b] focus:bg-white"
          />
        </label>
      </div>
      {state.status === "error" && state.message ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm font-medium text-amber-800">
          {state.message}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

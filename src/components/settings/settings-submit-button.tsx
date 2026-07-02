"use client";

import { useFormStatus } from "react-dom";

export function SettingsSubmitButton({ label = "Save settings" }: { label?: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center justify-center rounded-full bg-[#087968] px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(8,121,104,0.22)] transition hover:bg-[#066657] disabled:cursor-not-allowed disabled:bg-[#9fb8b2]"
    >
      {pending ? "Saving..." : label}
    </button>
  );
}


"use client";

import { useState } from "react";

export function CopyValueButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="rounded-md border border-[#cdd8d5] bg-white px-3 py-2 text-xs font-semibold text-[#10201d] shadow-sm transition hover:border-[#9db2ad] hover:bg-[#f7faf9]"
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

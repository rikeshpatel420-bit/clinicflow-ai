import type { ReactNode } from "react";

export function ModalFrame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-xl">
      <h2 className="text-lg font-semibold text-[#10201d]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}


import type { ReactNode } from "react";

export function DrawerFrame({ children, title }: { children: ReactNode; title: string }) {
  return (
    <aside className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-[#10201d]">{title}</h2>
      <div className="mt-4">{children}</div>
    </aside>
  );
}


import type { ReactNode } from "react";

export function SettingsCard({
  children,
  eyebrow,
  title,
  description,
}: {
  children: ReactNode;
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      {eyebrow ? <p className="text-sm font-semibold text-[#087968]">{eyebrow}</p> : null}
      <h2 className="mt-1 text-lg font-semibold text-[#10201d]">{title}</h2>
      {description ? <p className="mt-2 text-sm leading-6 text-[#65736f]">{description}</p> : null}
      <div className="mt-5">{children}</div>
    </article>
  );
}

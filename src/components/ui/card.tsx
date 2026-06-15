import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <article className={`rounded-lg border border-[#dce6e3] bg-white shadow-sm ${className}`}>{children}</article>;
}

export function CardHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-[#edf2f0] p-5">
      <h2 className="text-lg font-semibold text-[#10201d]">{title}</h2>
      {description ? <p className="mt-1 text-sm text-[#65736f]">{description}</p> : null}
    </div>
  );
}


import Link from "next/link";

export function EmptyState({
  actionHref,
  actionLabel,
  message,
  title,
}: {
  actionHref?: string;
  actionLabel?: string;
  message: string;
  title: string;
}) {
  return (
    <section aria-live="polite" className="rounded-lg border border-[#dce6e3] bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[#10201d]">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-[#65736f]">{message}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-5 inline-flex rounded-md bg-[#10201d] px-4 py-3 text-sm font-semibold text-white hover:bg-[#20332f] focus:outline-none focus:ring-2 focus:ring-[#18b7a0] focus:ring-offset-2"
        >
          {actionLabel}
        </Link>
      ) : null}
    </section>
  );
}

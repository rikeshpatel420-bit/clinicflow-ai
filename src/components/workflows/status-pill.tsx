export function StatusPill({ label }: { label: string }) {
  const normalLabel = label.replaceAll("_", " ");

  return (
    <span className="rounded-md bg-[#e9faf6] px-2.5 py-1 text-xs font-semibold capitalize text-[#087968]">
      {normalLabel}
    </span>
  );
}

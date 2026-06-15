export function ThreadCard({
  thread,
}: {
  thread: { id: string; patient: string; channel: string; owner: string; tags: string[]; score: number; status: string };
}) {
  return (
    <article className="rounded-lg border border-[#dce6e3] bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#087968]">{thread.channel}</p>
          <h2 className="mt-2 text-lg font-semibold text-[#10201d]">{thread.patient}</h2>
        </div>
        <span className="rounded-md bg-[#10201d] px-2.5 py-1 text-xs font-semibold text-white">{thread.score}</span>
      </div>
      <p className="mt-3 text-sm text-[#65736f]">Owner: {thread.owner} / {thread.status}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {thread.tags.map((tag) => (
          <span key={tag} className="rounded-md bg-[#f7faf9] px-2.5 py-1 text-xs font-semibold text-[#394642]">{tag}</span>
        ))}
      </div>
    </article>
  );
}


export default function LeaderboardLoading() {
  const block = "animate-pulse rounded-2xl bg-white/[0.06]";

  return (
    <div className="space-y-8" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading leaderboard…</span>

      {/* Header */}
      <div className="space-y-3">
        <div className={`${block} h-10 w-56`} />
        <div className={`${block} h-4 w-80 max-w-full`} />
      </div>

      {/* Period tabs */}
      <div className={`${block} h-11 w-full max-w-md`} />

      {/* Summary tiles */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${block} h-16`} />
        ))}
      </div>

      {/* Podium */}
      <div className="grid items-start gap-4 md:grid-cols-3">
        <div className={`${block} order-2 h-72 md:order-1 md:mt-8`} />
        <div className={`${block} order-1 h-80 md:order-2`} />
        <div className={`${block} order-3 h-72 md:mt-12`} />
      </div>

      {/* Table */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${block} h-16`} />
          ))}
        </div>
        <div className={`${block} hidden h-64 lg:block`} />
      </div>
    </div>
  );
}
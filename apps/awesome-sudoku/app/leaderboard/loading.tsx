import { cn } from "@shared/model/utils";

export default function LeaderboardLoading() {
  return (
    <main
      className={cn(
        "min-h-svh",
        "bg-[rgb(var(--color-surface-secondary))]",
      )}
    >
      {/* Header skeleton */}
      <div
        className={cn(
          "sticky top-0 z-30",
          "bg-[rgb(var(--color-glass))]/[var(--glass-opacity)]",
          "backdrop-blur-xl",
          "border-b border-[rgb(var(--color-border-light))]/50",
          "px-4 py-4",
        )}
      >
        <div className="h-6 w-16 rounded-md bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-4">
        {/* Tab skeleton */}
        <div className="flex gap-1 p-1 rounded-xl bg-[rgb(var(--color-bg-tertiary))]">
          <div className="flex-1 h-9 rounded-lg bg-[rgb(var(--color-surface-primary))] animate-pulse" />
          <div className="flex-1 h-9 rounded-lg animate-pulse" />
        </div>

        {/* Table skeleton */}
        <div
          className={cn(
            "bg-[rgb(var(--color-surface-primary))]",
            "rounded-2xl shadow-sm",
            "border border-[rgb(var(--color-border-light))]/50",
            "p-4 space-y-4",
          )}
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
              <div className="flex-1 h-4 rounded bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
              <div className="w-16 h-4 rounded bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

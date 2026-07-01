import { cn } from "@shared/model/utils";

export default function ProfileLoading() {
  return (
    <main className="min-h-svh bg-[rgb(var(--color-surface-secondary))]">
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

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Profile card skeleton */}
        <div
          className={cn(
            "bg-[rgb(var(--color-surface-primary))]",
            "rounded-2xl shadow-sm",
            "border border-[rgb(var(--color-border-light))]",
            "overflow-hidden",
          )}
        >
          <div className="h-24 bg-gradient-to-r from-blue-500/50 to-indigo-600/50 animate-pulse" />
          <div className="px-6 pb-6">
            <div className="-mt-12 mb-4">
              <div
                className={cn(
                  "w-24 h-24 rounded-full animate-pulse",
                  "bg-[rgb(var(--color-bg-tertiary))]",
                  "ring-4 ring-[rgb(var(--color-surface-primary))]",
                )}
              />
            </div>
            <div className="h-6 w-32 rounded bg-[rgb(var(--color-bg-tertiary))] animate-pulse mb-2" />
            <div className="h-4 w-48 rounded bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
          </div>
        </div>

        {/* Stats skeleton */}
        <div
          className={cn(
            "bg-[rgb(var(--color-surface-primary))]",
            "rounded-2xl shadow-sm",
            "border border-[rgb(var(--color-border-light))]",
            "p-6",
          )}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="h-8 w-16 mx-auto rounded bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
                <div className="h-3 w-12 mx-auto rounded bg-[rgb(var(--color-bg-tertiary))] animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

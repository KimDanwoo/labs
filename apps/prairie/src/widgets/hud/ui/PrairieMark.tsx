export function PrairieMark() {
  return (
    <div className="flex items-center gap-sm sm:gap-md">
      <svg
        aria-hidden
        viewBox="0 0 40 40"
        className="size-8 shrink-0 sm:size-10"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      >
        <path d="M21 4 25 15 36 19 25 23 21 34 17 23 6 19 17 15Z" fill="currentColor" stroke="none" />
        <path d="M6 32c7 3 20-1 28-12" strokeLinecap="round" />
        <circle cx="33" cy="7" r="2" fill="currentColor" stroke="none" />
      </svg>
      <div>
        <p className="font-display text-xl font-medium tracking-tight sm:text-3xl">
          unicorn rush<span className="text-prairie-accent">.</span>
        </p>
      </div>
    </div>
  );
}

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
        <circle cx="20" cy="20" r="18" />
        <path d="M20 31V10m0 12c-7 0-9-5-9-8 6 0 9 4 9 8Zm0-5c6 0 8-4 8-7-5 0-8 3-8 7Zm0 10c6 0 9-4 9-7-6 0-9 3-9 7Z" />
      </svg>
      <div>
        <p className="font-display text-2xl font-medium tracking-tight sm:text-3xl">
          prairie<span className="text-prairie-accent">.</span>
        </p>
      </div>
    </div>
  );
}

'use client';

type FiveElementKey = '木' | '火' | '土' | '金' | '水';

type PillarCardProps = {
  label: string;
  stem: string;
  branch: string;
  stemElement: string;
  branchElement: string;
};

const ELEMENT_COLORS: Record<FiveElementKey, string> = {
  木: '#4ade80',
  火: '#f87171',
  土: '#fbbf24',
  金: '#e2e8f0',
  水: '#60a5fa',
};

const ELEMENT_BG: Record<FiveElementKey, string> = {
  木: 'rgba(74, 222, 128, 0.12)',
  火: 'rgba(248, 113, 113, 0.12)',
  土: 'rgba(251, 191, 36, 0.12)',
  金: 'rgba(226, 232, 240, 0.12)',
  水: 'rgba(96, 165, 250, 0.12)',
};

function ElementBadge({ element }: { element: string }) {
  const key = element as FiveElementKey;
  const color = ELEMENT_COLORS[key] ?? '#8a8aa0';
  const bg = ELEMENT_BG[key] ?? 'rgba(138,138,160,0.12)';

  return (
    <span
      className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ color, backgroundColor: bg, border: `1px solid ${color}40` }}
    >
      {element}
    </span>
  );
}

export function PillarCard({
  label,
  stem,
  branch,
  stemElement,
  branchElement,
}: PillarCardProps) {
  return (
    <div className="flex flex-col items-center gap-2 bg-card-bg border border-card-border rounded-2xl p-3 shadow-lg shadow-black/40 min-w-0">
      <span className="text-[10px] font-medium text-muted tracking-widest uppercase">
        {label}
      </span>

      <div className="flex flex-col items-center gap-1 py-2">
        <span
          className="text-3xl font-bold leading-none text-gold"
          style={{
            textShadow: '0 0 20px rgba(212,165,116,0.4)',
          }}
        >
          {stem}
        </span>
        <div className="w-px h-3 bg-card-border" />
        <span className="text-3xl font-bold leading-none text-foreground">
          {branch}
        </span>
      </div>

      <div className="flex flex-col items-center gap-1 w-full">
        <ElementBadge element={stemElement} />
        <ElementBadge element={branchElement} />
      </div>
    </div>
  );
}

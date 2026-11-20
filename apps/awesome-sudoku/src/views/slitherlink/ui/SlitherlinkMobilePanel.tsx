import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { GameControls } from '@views/slitherlink/ui/GameControls';
import { RulesList } from '@views/slitherlink/ui/RulesList';
import { LuChevronDown } from 'react-icons/lu';

export function SlitherlinkMobilePanel() {
  return (
    <div className="w-full max-w-[400px] space-y-4 lg:hidden">
      <GameControls />
      <details className="group rounded-2xl bg-glass/60 ring-1 ring-border-light/70 backdrop-blur-sm">
        <summary className="flex min-h-11 cursor-pointer list-none items-center [&::-webkit-details-marker]:hidden justify-between rounded-2xl px-4 text-sm font-semibold text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
          {SLITHERLINK_COPY.rulesTitle}
          <LuChevronDown aria-hidden="true" className="text-text-tertiary transition-transform group-open:rotate-180" />
        </summary>
        <div className="px-4 pb-4">
          <RulesList />
        </div>
      </details>
    </div>
  );
}

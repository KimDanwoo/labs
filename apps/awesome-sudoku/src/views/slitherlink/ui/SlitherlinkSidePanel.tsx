import { SLITHERLINK_COPY } from '@views/slitherlink/config/copy';
import { GameControls } from '@views/slitherlink/ui/GameControls';
import { RulesList } from '@views/slitherlink/ui/RulesList';

export function SlitherlinkSidePanel() {
  return (
    <aside className="hidden pt-15 lg:block">
      <div className="flex w-80 flex-col gap-6 rounded-3xl bg-face p-5 xl:w-90">
        <GameControls />
        <section className="space-y-3 border-t border-border-light pt-5">
          <h2 className="text-xs font-semibold tracking-wider text-text-secondary">{SLITHERLINK_COPY.rulesTitle}</h2>
          <RulesList />
        </section>
      </div>
    </aside>
  );
}

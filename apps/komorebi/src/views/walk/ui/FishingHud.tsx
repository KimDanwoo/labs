import type { createAmbience } from '@views/walk/lib/audio';
import type { CompanionReaction } from '@views/walk/lib/companions';
import { FISH, FISH_RARITY } from '@views/walk/lib/fishTable';
import { FISHING_PHASE, type FishingFrame } from '@views/walk/lib/fishing';
import { catchBadge, fishingMessage } from '@views/walk/lib/fishingCopy';
import { useFishingSession } from '@views/walk/model/hooks/useFishingSession';
import { FishingContext } from '@views/walk/model/store/fishingContext';
import { CatchResult } from '@views/walk/ui/CatchResult';
import { FishingActionButton } from '@views/walk/ui/FishingActionButton';
import { FishingFight } from '@views/walk/ui/FishingFight';
import { FishingFooter } from '@views/walk/ui/FishingFooter';

interface FishingHudProps {
  onClose: () => void;
  onReact: (reaction: CompanionReaction) => void;
  onSound: ReturnType<typeof createAmbience>['fishingCue'];
  onFrame: (frame: FishingFrame | null) => void;
}

export function FishingHud({ onClose, onFrame, onSound, onReact }: FishingHudProps) {
  const session = useFishingSession({ onClose, onSound, onFrame });
  const { phase, caught, isNew } = session;
  const fish = FISH.find((item) => item.id === caught?.id);
  const isLegendary = fish?.rarity === FISH_RARITY.legendary;
  const isCaught = phase === FISHING_PHASE.caught;

  return (
    <FishingContext.Provider value={{ ...session, onReact }}>
      <section className="pier-fishing-hud" aria-label="부두 낚시" data-phase={phase}>
        <div className="pier-fishing-heading">
          <strong>🎣 부두에서 낚시 중</strong>
          <button onClick={onClose} aria-label="낚시 그만하기">
            그만하기 <kbd>Esc</kbd>
          </button>
        </div>
        {isCaught && fish && caught && (
          <CatchResult
            fish={fish}
            caught={caught}
            badge={catchBadge({ isRecord: session.isRecord, isNew, isLegendary })}
            isLegendary={isLegendary}
            hasSaveError={session.hasSaveError}
          />
        )}
        <p role="status" className={phase === FISHING_PHASE.bite ? 'pier-bite-message' : ''}>
          {fishingMessage({ phase, failure: session.failure, fishName: fish?.name, caught, isNew })}
        </p>
        {phase === FISHING_PHASE.fighting && caught ? (
          <FishingFight fish={caught} isPerfect={session.isPerfect} onFinish={session.finishFight} onFrame={onFrame} />
        ) : (
          <FishingActionButton />
        )}
        <FishingFooter />
      </section>
    </FishingContext.Provider>
  );
}

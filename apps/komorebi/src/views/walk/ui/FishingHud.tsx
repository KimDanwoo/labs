import type { createAmbience } from '../lib/audio';
import type { CompanionReaction } from '../lib/companions';
import { FISH, FISHING_PHASE, FISH_RARITY, type FishingFrame } from '../lib/fishing';
import { catchBadge, fishingActionLabel, fishingMessage } from '../lib/fishingCopy';
import { useFishingSession } from '../model/hooks/useFishingSession';
import { CatchChoices } from './CatchChoices';
import { CatchResult } from './CatchResult';
import { FishJournal } from './FishJournal';
import { FishingFight } from './FishingFight';

interface FishingHudProps {
  onClose: () => void;
  onReact: (reaction: CompanionReaction) => void;
  onSound: ReturnType<typeof createAmbience>['fishingCue'];
  onFrame: (frame: FishingFrame | null) => void;
}

export function FishingHud({ onClose, onFrame, onSound, onReact }: FishingHudProps) {
  const session = useFishingSession({ onClose, onSound, onFrame });
  const { phase, caught, isNew, isCelebrating } = session;
  const fish = FISH.find((item) => item.id === caught?.id);
  const isLegendary = fish?.rarity === FISH_RARITY.legendary;
  const isCaught = phase === FISHING_PHASE.caught;

  return (
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
        <button
          className="continue-button"
          onClick={session.act}
          disabled={phase === FISHING_PHASE.casting || isCelebrating}
        >
          <kbd>E</kbd> {isCelebrating ? '잡았다! ♥' : fishingActionLabel(phase)}
        </button>
      )}
      {isCaught && !isCelebrating && (
        <CatchChoices key={session.keptUid ?? 'overflow'} uid={session.keptUid} onReact={onReact} />
      )}
      <small>
        {isCaught ? '기록은 이 브라우저에 보관돼요 · E로 다시 던지기' : '바다의 찌를 보세요 · 입질하면 E로 챔질'}
      </small>
      <FishJournal collection={session.collection} />
      {session.hasSaveError && <p role="alert">도감을 저장하지 못했어요. 현재 화면에서는 기록을 볼 수 있어요.</p>}
    </section>
  );
}

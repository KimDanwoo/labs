import type { Catch, FISH } from '../lib/fishing';

interface CatchResultProps {
  fish: (typeof FISH)[number];
  caught: Catch;
  badge: string;
  isLegendary: boolean;
  hasSaveError: boolean;
}

export function CatchResult({ fish, caught, badge, isLegendary, hasSaveError }: CatchResultProps) {
  return (
    <div className={isLegendary ? 'catch-result is-legendary' : 'catch-result'} aria-label="잡은 물고기">
      <span className="catch-result-symbol" aria-hidden="true">
        {fish.symbol}
      </span>
      <div>
        <small>{badge}</small>
        <strong>
          {fish.name} <span>{caught.size} cm</span>
        </strong>
        <small>
          {fish.rarity} · {hasSaveError ? '저장 확인이 필요해요' : '도감에 기록했어요'}
        </small>
      </div>
    </div>
  );
}

import { useExploration } from '@views/ride/model/exploration/store';
import { LANDMARKS } from '@views/ride/model/exploration/world';
import { JournalPlace } from '@views/ride/ui/exploration/hud/JournalPlace';

export function ExplorationJournal() {
  const { discovered, best, storageUnavailable } = useExploration();
  return (
    <div
      id="exploration-journal"
      className="pointer-events-auto mt-2 rounded-2xl border border-prairie-paper/20 bg-prairie-ink/80 p-4 text-sm backdrop-blur-md"
    >
      <p className="mb-3 text-xs opacity-75">
        출발점 앞 하늘의 별빛 고리에서 바람길이 시작돼요.
        <br />
        고리는 출발점에서 멀어지는 방향으로 통과하세요.
      </p>
      <ul className="space-y-3">
        {LANDMARKS.map((place) => (
          <li key={place.id}>
            <JournalPlace place={place} isDiscovered={discovered.includes(place.id)} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs">바람길 최고 기록 · {best === null ? '아직 기록이 없어요' : `${best.toFixed(1)}초`}</p>
      <p className="mt-2 text-xs opacity-60">
        {storageUnavailable
          ? '저장 공간에 접근할 수 없어 이번 탐험에서만 기록돼요.'
          : '발견과 최고 기록은 이 브라우저에 저장돼요.'}
      </p>
    </div>
  );
}

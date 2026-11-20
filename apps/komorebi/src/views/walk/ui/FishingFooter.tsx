import { FISHING_PHASE } from '../lib/fishing';
import { useFishingContext } from '../model/hooks/useFishingContext';
import { CatchChoices } from './CatchChoices';
import { FishJournal } from './FishJournal';

export function FishingFooter() {
  const { phase, isCelebrating, keptUid, collection, hasSaveError, onReact } = useFishingContext();
  const isCaught = phase === FISHING_PHASE.caught;
  return (
    <>
      {isCaught && !isCelebrating && <CatchChoices key={keptUid ?? 'overflow'} uid={keptUid} onReact={onReact} />}
      <small>
        {isCaught ? '기록은 이 브라우저에 보관돼요 · E로 다시 던지기' : '바다의 찌를 보세요 · 입질하면 E로 챔질'}
      </small>
      <FishJournal collection={collection} />
      {hasSaveError && <p role="alert">도감을 저장하지 못했어요. 현재 화면에서는 기록을 볼 수 있어요.</p>}
    </>
  );
}

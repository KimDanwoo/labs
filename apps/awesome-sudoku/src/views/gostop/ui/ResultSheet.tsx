import { useDismissible } from '@shared/lib/useDismissible';
import { BottomSheet } from '@shared/ui/bottom-sheet';
import { OUTCOME_TITLE } from '@views/gostop/config/copy';
import { PHASE } from '@views/gostop/config/game';
import { outcomeOf } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useHeldValue } from '@views/gostop/model/hooks/useHeldValue';
import { GostopContext } from '@views/gostop/model/store/gostopContext';
import { ResultSheetBody } from '@views/gostop/ui/ResultSheetBody';

export function ResultSheet() {
  const game = useGostopContext();
  const isOver = game.phase === PHASE.OVER;
  const { isOpen, dismiss } = useDismissible(isOver);
  const shownGame = useHeldValue(game, isOver);

  return (
    <GostopContext.Provider value={shownGame}>
      <BottomSheet isOpen={isOpen} onClose={dismiss} title={OUTCOME_TITLE[outcomeOf(shownGame.result)]}>
        <ResultSheetBody />
      </BottomSheet>
    </GostopContext.Provider>
  );
}

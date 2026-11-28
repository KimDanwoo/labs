import { LuMenu, LuRotateCcw } from 'react-icons/lu';

import { BottomSheet } from '@shared/ui/bottom-sheet';
import { Button } from '@shared/ui/button';
import { CircleButton } from '@shared/ui/circle-button';
import { GOSTOP_COPY, MENU_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useToggle } from '@views/gostop/model/hooks/useToggle';
import { GostopRecord } from '@views/gostop/ui/GostopRecord';
import { GostopRule } from '@views/gostop/ui/GostopRule';

export function GostopMenu() {
  const { deal } = useGostopContext();
  const menu = useToggle();

  const handleNewGame = () => {
    menu.close();
    deal();
  };

  return (
    <div className="lg:hidden short-landscape:hidden">
      <CircleButton size="l" aria-label={MENU_COPY.open} aria-haspopup="dialog" onClick={menu.open}>
        <LuMenu aria-hidden="true" />
      </CircleButton>
      <BottomSheet isOpen={menu.isOpen} onClose={menu.close} title={MENU_COPY.title}>
        <div className="grid gap-4">
          <Button variant="weak" size="xl" isFull onClick={handleNewGame}>
            <LuRotateCcw aria-hidden="true" />
            {GOSTOP_COPY.newGame}
          </Button>
          <GostopRecord />
          <GostopRule />
        </div>
      </BottomSheet>
    </div>
  );
}

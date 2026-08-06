import { WRONG_FLASH_MS } from '@entities/stardoku/model/constants';
import { CellPosition } from '@entities/stardoku/model/types';
import { wrongFlashAtom } from '@features/stardoku-game/model/atoms';
import { useAtom } from 'jotai';
import { useEffect } from 'react';

/** 오답 플래시 위치를 반환하고 일정 시간 후 자동으로 지운다 */
export const useWrongFlash = (): CellPosition | null => {
  const [wrongFlash, setWrongFlash] = useAtom(wrongFlashAtom);

  useEffect(() => {
    if (!wrongFlash) return undefined;
    const timer = setTimeout(() => setWrongFlash(null), WRONG_FLASH_MS);
    return () => clearTimeout(timer);
  }, [wrongFlash, setWrongFlash]);

  return wrongFlash;
};

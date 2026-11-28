'use client';

import { STORAGE_KEY } from '@views/gostop/config/storage';
import { parseWallet, readyWallet, settleGame } from '@views/gostop/lib/money';
import { finishedGameOf, settlementOfView, walletView, type DailyBonus } from '@views/gostop/lib/moneyView';
import { readWallet } from '@views/gostop/lib/walletStore';
import { useDailyBonus } from '@views/gostop/model/hooks/useDailyBonus';
import { useStoredValue } from '@views/gostop/model/hooks/useStoredValue';
import type { GameState } from '@views/gostop/model/types/gostop';
import type { Settlement, Wallet } from '@views/gostop/model/types/money';
import { useCallback, useEffect, useMemo } from 'react';

export interface WalletControl {
  wallet: Wallet;
  settlement: Settlement | null;
  settledGameId: string | null;
  bonus: DailyBonus | null;
  dismissBonus: () => void;
  prepareWallet: () => void;
}

export const useWallet = (game: GameState, gameId: string | null, isSettled: boolean): WalletControl => {
  const [stored, save] = useStoredValue(STORAGE_KEY.WALLET, parseWallet);
  const { bonus, claimBonus, dismissBonus } = useDailyBonus(save);
  const finished = useMemo(
    () => finishedGameOf(game.phase, game.result, gameId, isSettled),
    [game.phase, game.result, gameId, isSettled],
  );

  useEffect(() => {
    if (!finished) return;
    const fresh = readWallet();
    const next = settleGame(fresh, finished.gameId, finished.result);
    if (next !== fresh) save(next);
  }, [finished, save]);

  const prepareWallet = useCallback(() => {
    claimBonus();
    const fresh = readWallet();
    const next = readyWallet(fresh);
    if (next !== fresh) save(next);
  }, [claimBonus, save]);

  return useMemo(() => {
    const wallet = walletView(stored, finished);
    return {
      wallet,
      settlement: settlementOfView(wallet, finished),
      settledGameId: finished?.gameId ?? null,
      bonus,
      dismissBonus,
      prepareWallet,
    };
  }, [stored, finished, bonus, dismissBonus, prepareWallet]);
};

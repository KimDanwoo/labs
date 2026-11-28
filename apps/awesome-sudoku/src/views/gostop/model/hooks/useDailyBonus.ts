'use client';

import { claimToday, type DailyBonus } from '@views/gostop/lib/moneyView';
import { readWallet } from '@views/gostop/lib/walletStore';
import type { Wallet } from '@views/gostop/model/types/money';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export interface DailyBonusControl {
  bonus: DailyBonus | null;
  claimBonus: () => void;
  dismissBonus: () => void;
}

const systemNow = (): Date => new Date();

export const useDailyBonus = (save: (next: Wallet) => void, now: () => Date = systemNow): DailyBonusControl => {
  const [bonus, setBonus] = useState<DailyBonus | null>(null);
  const claimedDateRef = useRef<string | null>(null);

  const claimBonus = useCallback(() => {
    const claim = claimToday(readWallet(), now);
    if (!claim.bonus) return;
    if (claimedDateRef.current === claim.bonus.date) return;
    claimedDateRef.current = claim.bonus.date;
    save(claim.wallet);
    setBonus(claim.bonus);
  }, [save, now]);

  useEffect(() => {
    claimBonus();
  }, [claimBonus]);

  const dismissBonus = useCallback(() => setBonus(null), []);

  return useMemo(() => ({ bonus, claimBonus, dismissBonus }), [bonus, claimBonus, dismissBonus]);
};

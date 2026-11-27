'use client';

import { createContext } from 'react';

import type { LottoGame } from '@views/lotto/model/hooks/useLottoGame';

export const LottoContext = createContext<LottoGame | null>(null);

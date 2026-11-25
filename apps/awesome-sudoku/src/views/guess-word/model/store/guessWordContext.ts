'use client';

import type { GuessWordGame } from '@views/guess-word/model/hooks/useGuessWordGame';
import { createContext } from 'react';

export const GuessWordContext = createContext<GuessWordGame | null>(null);

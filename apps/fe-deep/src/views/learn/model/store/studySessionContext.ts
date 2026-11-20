'use client';

import type { CardStudySession } from '@views/learn/model/hooks/useCardStudySession';
import { createContext } from 'react';

export const StudySessionContext = createContext<CardStudySession | null>(null);

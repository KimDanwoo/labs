'use client';

import { createContext } from 'react';
import type { CardStudySession } from '../hooks/useCardStudySession';

export const StudySessionContext = createContext<CardStudySession | null>(null);

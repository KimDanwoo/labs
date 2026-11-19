'use client';

import { createContext } from 'react';
import type { StudySetup } from '../hooks/useStudySetup';

export const StudySetupContext = createContext<StudySetup | null>(null);

'use client';

import type { StudySetup } from '@views/learn/model/hooks/useStudySetup';
import { createContext } from 'react';

export const StudySetupContext = createContext<StudySetup | null>(null);

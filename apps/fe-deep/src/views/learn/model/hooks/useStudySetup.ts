import type { Category } from '@entities/question';

import type { StudySettings } from '../constants/study';
import { useStudySettingsForm } from './useStudySettingsForm';

export interface StudySetupSource {
  categories: Category[];
  isLoadingCategories: boolean;
  initialSettings: StudySettings;
  isStarting: boolean;
  isEmpty: boolean;
  onStart: (settings: StudySettings) => void;
}

export type StudySetup = StudySetupSource & ReturnType<typeof useStudySettingsForm> & { start: () => void };

export function useStudySetup(source: StudySetupSource): StudySetup {
  const form = useStudySettingsForm(source.initialSettings);
  return { ...source, ...form, start: () => source.onStart(form.settings) };
}

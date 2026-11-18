import { useState } from 'react';

import type { Difficulty } from '@entities/question';

import type { StudySettings } from '../constants/study';

export function useStudySettingsForm(initialSettings: StudySettings) {
  const [settings, setSettings] = useState(initialSettings);

  const changeSettings = (patch: Partial<StudySettings>) => setSettings({ ...settings, ...patch });

  const toggleDifficulty = (value: Difficulty) => {
    const { difficulties } = settings;
    changeSettings({
      difficulties: difficulties.includes(value)
        ? difficulties.filter((difficulty) => difficulty !== value)
        : [...difficulties, value],
    });
  };

  return { settings, changeSettings, toggleDifficulty };
}

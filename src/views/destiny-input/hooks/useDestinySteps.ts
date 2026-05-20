'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { useSetAtom } from 'jotai';

import { destinyFormAtom } from '@entities/destiny/model';

import { REGION_OPTIONS, SHICHEN_OPTIONS, STEP_CONFIGS } from '../constants';
import type { FormState, Step } from '../types';

function parseBirthDate(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  if (year < 1900 || year > 2100) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
}

export function useDestinySteps(form: FormState) {
  const router = useRouter();
  const setDestinyForm = useSetAtom(destinyFormAtom);
  const [step, setStep] = useState<Step>(0);
  const [showForm, setShowForm] = useState(false);

  const config = STEP_CONFIGS[step];
  const currentImage = showForm ? config.withoutBubble : config.withBubble;

  const handleOpenForm = () => setShowForm(true);

  const handleStep0Next = () => {
    const parsed = parseBirthDate(form.birthDate);
    if (!form.name.trim() || !parsed) return;
    setShowForm(false);
    setStep(1);
  };

  const handleSubmit = () => {
    const parsed = parseBirthDate(form.birthDate);
    if (!parsed) return;

    const selected = SHICHEN_OPTIONS.find((s) => s.value === form.shichen);
    const region = REGION_OPTIONS.find((r) => r.value === form.region);

    setDestinyForm({
      ...parsed,
      hour: selected ? selected.hour : 12,
      minute: selected ? selected.minute : 0,
      gender: form.gender,
      name: form.name,
      ...(region && { region: region.label, longitude: region.longitude }),
      ...(form.note.trim() && { note: form.note.trim() }),
    });

    router.push('/result');
  };

  return {
    step,
    showForm,
    currentImage,
    handleOpenForm,
    handleStep0Next,
    handleSubmit,
  };
}

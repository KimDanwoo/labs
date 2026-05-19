'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { INITIAL_STATE, SHICHEN_OPTIONS, STEP_CONFIGS } from '../constants';
import type { FormState, Step } from '../types';

function parseBirthDate(raw: string): {
  year: number;
  month: number;
  day: number;
} | null {
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

export function useDestinyForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const updateField = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const parsed = parseBirthDate(form.birthDate);
  const isStep0Valid = Boolean(form.name.trim() && parsed);

  return { form, setForm, updateField, isStep0Valid };
}

export function useDestinySteps(form: FormState) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(0);
  const [showForm, setShowForm] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const config = STEP_CONFIGS[step];
  const currentImage = showForm ? config.withoutBubble : config.withBubble;

  const handleOpenForm = () => {
    setShowForm(true);
  };

  const handleStep0Next = () => {
    const parsed = parseBirthDate(form.birthDate);
    if (!form.name.trim() || !parsed) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setShowForm(false);
      setStep(1);
      setIsTransitioning(false);
    }, 300);
  };

  const handleSubmit = () => {
    const parsed = parseBirthDate(form.birthDate);
    if (!parsed) return;

    const selected = SHICHEN_OPTIONS.find((s) => s.value === form.shichen);
    const hour = selected ? selected.hour : 12;
    const minute = selected ? selected.minute : 0;

    const params = new URLSearchParams({
      name: form.name,
      year: String(parsed.year),
      month: String(parsed.month),
      day: String(parsed.day),
      hour: String(hour),
      minute: String(minute),
      gender: form.gender,
    });
    if (form.region.trim()) params.set('region', form.region.trim());
    if (form.note.trim()) params.set('note', form.note.trim());
    router.push(`/result?${params.toString()}`);
  };

  return {
    step,
    showForm,
    setShowForm,
    isTransitioning,
    currentImage,
    handleOpenForm,
    handleStep0Next,
    handleSubmit,
  };
}

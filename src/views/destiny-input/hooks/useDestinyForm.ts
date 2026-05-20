'use client';

import { useState } from 'react';

import { INITIAL_STATE } from '../constants';
import type { FormState } from '../types';

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

export function useDestinyForm() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const updateField = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const parsed = parseBirthDate(form.birthDate);
  const isStep0Valid = Boolean(form.name.trim() && parsed);

  return { form, setForm, updateField, parsed, isStep0Valid };
}

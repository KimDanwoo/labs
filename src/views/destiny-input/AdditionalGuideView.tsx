'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtomValue, useSetAtom } from 'jotai';

import { destinyFormAtom, inputFormAtom } from '@entities/destiny/model';

import { SHICHEN_OPTIONS } from './constants';
import { GuideScreen } from './ui';

function parseBirthDate(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  return {
    year: Number(digits.slice(0, 4)),
    month: Number(digits.slice(4, 6)),
    day: Number(digits.slice(6, 8)),
  };
}

export function AdditionalGuideView() {
  const router = useRouter();
  const form = useAtomValue(inputFormAtom);
  const setDestinyForm = useSetAtom(destinyFormAtom);

  const handleSkip = () => {
    const parsed = parseBirthDate(form.birthDate);
    if (!parsed) return;

    const selected = SHICHEN_OPTIONS.find((s) => s.value === form.shichen);

    setDestinyForm({
      ...parsed,
      hour: selected ? selected.hour : 12,
      minute: selected ? selected.minute : 0,
      gender: form.gender,
      name: form.name,
    });

    router.push('/result');
  };

  return (
    <div className="w-full h-dvh flex flex-col bg-background overflow-hidden">
      <Link
        href="/input/form"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80"
      >
        ←
      </Link>
      <GuideScreen
        imageSrc="/form_step_2.jpeg"
        href="/input/additional/form"
        onSkip={handleSkip}
      />
    </div>
  );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtomValue, useSetAtom } from 'jotai';

import { destinyFormAtom, inputFormAtom } from '@entities/destiny/model';

import { Button, FormField, Select, Textarea } from '@shared/ui';

import { REGION_OPTIONS, SHICHEN_OPTIONS } from './constants';

function parseBirthDate(raw: string) {
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  return {
    year: Number(digits.slice(0, 4)),
    month: Number(digits.slice(4, 6)),
    day: Number(digits.slice(6, 8)),
  };
}

export function AdditionalFormView() {
  const router = useRouter();
  const form = useAtomValue(inputFormAtom);
  const setInputForm = useSetAtom(inputFormAtom);
  const setDestinyForm = useSetAtom(destinyFormAtom);

  const updateField = (field: keyof typeof form) => (value: string) =>
    setInputForm((prev) => ({ ...prev, [field]: value }));

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

  return (
    <div className="w-full h-dvh flex flex-col bg-background overflow-hidden">
      <Link
        href="/input/additional"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80"
      >
        ←
      </Link>

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <Image
          src="/form_step_2_empty.webp"
          alt="추가정보 입력 배경"
          fill
          className="object-cover"
        />
        <div className="relative z-10 flex-1 flex flex-col justify-end overflow-y-auto">
          <div className="px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-background/85 backdrop-blur-sm rounded-t-3xl">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-gold">추가 정보</h2>
              <p className="text-sm text-muted mt-1">
                선택사항이에요. 입력하면 더 정확한 풀이가 가능해요.
              </p>
            </div>

            <FormField
              label="출생 지역"
              hint="지역에 따라 태양시 보정이 적용돼요"
            >
              <Select
                value={form.region}
                onChange={updateField('region')}
                placeholder="선택 안 함"
                options={REGION_OPTIONS.map((opt) => ({
                  value: opt.value,
                  label: opt.label,
                }))}
              />
            </FormField>

            <FormField label="특이사항" className="mb-6">
              <Textarea
                value={form.note}
                onChange={updateField('note')}
                placeholder="궁금한 점이나 참고할 사항이 있다면 적어주세요"
                rows={3}
              />
            </FormField>

            <Button onClick={handleSubmit} fullWidth>
              사주 보기 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

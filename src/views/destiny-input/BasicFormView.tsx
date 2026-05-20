'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAtom } from 'jotai';

import { inputFormAtom } from '@entities/destiny/model';

import { Button, FormField, Input, Select } from '@shared/ui';

import { SHICHEN_OPTIONS } from './constants';

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

export function BasicFormView() {
  const router = useRouter();
  const [form, setForm] = useAtom(inputFormAtom);

  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const parsed = parseBirthDate(form.birthDate);
  const isValid = Boolean(form.name.trim() && parsed);

  const handleNext = () => {
    if (!isValid) return;
    router.push('/input/additional');
  };

  return (
    <div className="w-full h-dvh flex flex-col bg-background overflow-hidden">
      <Link
        href="/input"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80"
      >
        ←
      </Link>

      <div className="relative flex-1 flex flex-col overflow-hidden">
        <Image
          src="/form_step_1.webp"
          alt="사주 입력 배경"
          fill
          className="object-cover"
          preload
        />
        <div className="relative z-10 flex-1 flex flex-col justify-end overflow-y-auto">
          <div className="px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] bg-background/85 backdrop-blur-sm rounded-t-3xl">
            <div className="text-center mb-5">
              <h2 className="text-lg font-bold text-gold">기본 정보</h2>
            </div>

            <FormField label="성함">
              <Input
                value={form.name}
                onChange={updateField('name')}
                placeholder="이름을 입력해주세요"
              />
            </FormField>

            <FormField label="성별">
              <div className="flex gap-3">
                {(['male', 'female'] as const).map((g) => (
                  <label
                    key={g}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="gender"
                      checked={form.gender === g}
                      onChange={() =>
                        setForm((prev) => ({ ...prev, gender: g }))
                      }
                      className="w-3.5 h-3.5 accent-gold cursor-pointer"
                    />
                    <span className="text-xs font-medium text-foreground">
                      {g === 'male' ? '남자' : '여자'}
                    </span>
                  </label>
                ))}
              </div>
            </FormField>

            <FormField label="생년월일" hint="예: 19931101 (8자리)">
              <Input
                type="text"
                inputMode="numeric"
                value={form.birthDate}
                onChange={updateField('birthDate')}
                placeholder="19931101"
              />
            </FormField>

            <FormField label="태어난 시간 (선택)" className="mb-6">
              {!form.unknownTime && (
                <Select
                  value={form.shichen}
                  onChange={updateField('shichen')}
                  placeholder="모름 / 선택 안 함"
                  options={SHICHEN_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: `${opt.label} (${opt.timeRange})`,
                  }))}
                />
              )}
              <label className="flex items-center gap-1.5 mt-1.5 ml-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.unknownTime}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      unknownTime: e.target.checked,
                      shichen: e.target.checked ? '' : prev.shichen,
                    }))
                  }
                  className="w-3.5 h-3.5 accent-gold cursor-pointer"
                />
                <span className="text-xs text-muted">
                  태어난 시간을 모릅니다
                </span>
              </label>
            </FormField>

            <Button onClick={handleNext} fullWidth disabled={!isValid}>
              다음 →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

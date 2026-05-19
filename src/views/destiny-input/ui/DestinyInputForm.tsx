'use client';

import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { Button, Card } from '@shared/ui';

type Gender = 'male' | 'female';

type FormState = {
  year: string;
  month: string;
  day: string;
  hour: string;
  minute: string;
  gender: Gender;
};

const INITIAL_STATE: FormState = {
  year: '',
  month: '',
  day: '',
  hour: '',
  minute: '',
  gender: 'male',
};

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  placeholder: string;
  suffix?: string;
};

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  suffix,
}: SelectFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted tracking-widest uppercase">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-12 px-3 pr-8 bg-input-bg border border-card-border rounded-lg text-foreground text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-all duration-200 cursor-pointer"
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
              {suffix}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">
          ▾
        </span>
      </div>
    </div>
  );
}

type YearInputProps = {
  value: string;
  onChange: (value: string) => void;
};

function YearInput({ value, onChange }: YearInputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted tracking-widest uppercase">
        년도
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={1900}
        max={2100}
        placeholder="예) 1990"
        className="w-full h-12 px-3 bg-input-bg border border-card-border rounded-lg text-foreground text-sm placeholder:text-muted focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/40 transition-all duration-200"
      />
    </div>
  );
}

type GenderToggleProps = {
  value: Gender;
  onChange: (value: Gender) => void;
};

function GenderToggle({ value, onChange }: GenderToggleProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted tracking-widest uppercase">
        성별
      </label>
      <div className="flex gap-2">
        {(['male', 'female'] as const).map((g) => {
          const isActive = value === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => onChange(g)}
              className={`flex-1 h-12 rounded-lg text-sm font-medium transition-all duration-200 border cursor-pointer ${
                isActive
                  ? 'bg-gold text-[#0a0a1a] border-gold shadow-lg shadow-gold/20'
                  : 'bg-transparent text-muted border-card-border hover:border-gold/50 hover:text-foreground'
              }`}
            >
              {g === 'male' ? '남자 ♂' : '여자 ♀'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DestinyInputForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL_STATE);

  const updateField = (field: keyof FormState) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid =
    form.year &&
    Number(form.year) >= 1900 &&
    Number(form.year) <= 2100 &&
    form.month &&
    form.day &&
    form.hour !== '' &&
    form.minute !== '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const params = new URLSearchParams({
      year: form.year,
      month: form.month,
      day: form.day,
      hour: form.hour,
      minute: form.minute,
      gender: form.gender,
    });

    router.push(`/result?${params.toString()}`);
  };

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      {/* 헤더 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-4">
          <span className="w-8 h-px bg-gold/40" />
          <span className="text-gold text-xs tracking-[0.3em] uppercase font-medium">
            Destiny
          </span>
          <span className="w-8 h-px bg-gold/40" />
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">
          청연사주
        </h1>
        <p className="text-sm text-muted leading-relaxed">
          생년월일시를 입력하면 사주팔자를 풀어드립니다
        </p>
      </div>

      {/* 폼 카드 */}
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* 섹션: 생년월일 */}
          <div>
            <p className="text-xs text-gold tracking-widest mb-3 font-medium">
              ◈ 생년월일
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-3 sm:col-span-1">
                <YearInput value={form.year} onChange={updateField('year')} />
              </div>
              <SelectField
                label="월"
                value={form.month}
                onChange={updateField('month')}
                options={MONTHS}
                placeholder="월"
                suffix="월"
              />
              <SelectField
                label="일"
                value={form.day}
                onChange={updateField('day')}
                options={DAYS}
                placeholder="일"
                suffix="일"
              />
            </div>
          </div>

          {/* 섹션: 생시 */}
          <div>
            <p className="text-xs text-gold tracking-widest mb-3 font-medium">
              ◈ 태어난 시각
            </p>
            <div className="grid grid-cols-2 gap-3">
              <SelectField
                label="시"
                value={form.hour}
                onChange={updateField('hour')}
                options={HOURS}
                placeholder="시"
                suffix="시"
              />
              <SelectField
                label="분"
                value={form.minute}
                onChange={updateField('minute')}
                options={MINUTES}
                placeholder="분"
                suffix="분"
              />
            </div>
          </div>

          {/* 섹션: 성별 */}
          <div>
            <p className="text-xs text-gold tracking-widest mb-3 font-medium">
              ◈ 성별
            </p>
            <GenderToggle
              value={form.gender}
              onChange={(v) => setForm((prev) => ({ ...prev, gender: v }))}
            />
          </div>

          {/* 구분선 */}
          <div className="h-px bg-card-border" />

          {/* 제출 버튼 */}
          <Button
            type="submit"
            variant="primary"
            disabled={!isValid}
            className="w-full text-base font-semibold tracking-wide"
          >
            사주 보기 →
          </Button>
        </form>
      </Card>

      {/* 하단 안내 */}
      <p className="text-center text-xs text-muted mt-4 opacity-60">
        입력하신 정보는 저장되지 않습니다
      </p>
    </div>
  );
}

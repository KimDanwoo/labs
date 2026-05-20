import type { Dispatch, SetStateAction } from 'react';

import { Button, FormField, Input, Select, ToggleGroup } from '@shared/ui';

import { SHICHEN_OPTIONS } from '../constants';
import type { FormState } from '../types';

type Step0FormProps = {
  form: FormState;
  setForm: Dispatch<SetStateAction<FormState>>;
  updateField: (field: keyof FormState) => (value: string) => void;
  isStep0Valid: boolean;
  onNext: () => void;
};

export function Step0Form({
  form,
  setForm,
  updateField,
  isStep0Valid,
  onNext,
}: Step0FormProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
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
        <ToggleGroup
          value={form.gender}
          onChange={(g) => setForm((prev) => ({ ...prev, gender: g }))}
          options={[
            { value: 'male', label: '남자' },
            { value: 'female', label: '여자' },
          ]}
        />
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
        <label className="flex items-center gap-2 mt-2 ml-1 cursor-pointer">
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
            className="w-4 h-4 accent-gold cursor-pointer"
          />
          <span className="text-sm text-muted">태어난 시간을 모릅니다</span>
        </label>
      </FormField>

      <Button onClick={onNext} fullWidth disabled={!isStep0Valid}>
        다음 →
      </Button>
    </div>
  );
}

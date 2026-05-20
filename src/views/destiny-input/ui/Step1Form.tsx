import { Button, FormField, Select, Textarea } from '@shared/ui';

import { REGION_OPTIONS } from '../constants';
import type { FormState } from '../types';

type Step1FormProps = {
  form: FormState;
  updateField: (field: keyof FormState) => (value: string) => void;
  onSubmit: () => void;
};

export function Step1Form({ form, updateField, onSubmit }: Step1FormProps) {
  return (
    <div className="flex-1 overflow-y-auto px-5 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="text-center mb-5">
        <h2 className="text-lg font-bold text-gold">추가 정보</h2>
        <p className="text-sm text-muted mt-1">
          선택사항이에요. 입력하면 더 정확한 풀이가 가능해요.
        </p>
      </div>

      <FormField label="출생 지역" hint="지역에 따라 태양시 보정이 적용돼요">
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

      <Button onClick={onSubmit} fullWidth>
        사주 보기 →
      </Button>
    </div>
  );
}

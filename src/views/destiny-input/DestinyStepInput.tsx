'use client';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@shared/lib/cn';
import { FormField, Input, Select, Textarea, ToggleGroup } from '@shared/ui';

import { SHICHEN_OPTIONS } from './constants';
import { useDestinyForm, useDestinySteps } from './hooks';

const goldButton = cn(
  'w-full h-13 rounded-full py-3.5 cursor-pointer',
  'bg-gold text-[#0a0a1a] text-base font-bold tracking-wide',
  'shadow-xl shadow-gold/30',
  'transition-all duration-300 hover:bg-gold-bright active:scale-[0.98]',
);

export function DestinyStepInput() {
  const { form, setForm, updateField, isStep0Valid } = useDestinyForm();
  const {
    step,
    showForm,
    isTransitioning,
    currentImage,
    handleOpenForm,
    handleStep0Next,
    handleSubmit,
  } = useDestinySteps(form);

  return (
    <div className="flex flex-col w-full max-w-[500px] mx-auto h-dvh overflow-hidden bg-background">
      {/* 뒤로가기 */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80 transition-colors hover:bg-background/80"
      >
        ←
      </Link>

      {/* 배경 이미지 */}
      <div className="relative w-full flex-1 min-h-0 transition-opacity duration-500">
        <Image
          src={currentImage}
          alt="사주 입력"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>

      {/* 말풍선 상태: 입력하기 버튼 */}
      {!showForm && !isTransitioning && (
        <div className="flex flex-col items-center px-6 py-8 -mt-16 relative z-10">
          <button
            type="button"
            onClick={handleOpenForm}
            className={cn(
              'w-full h-14 rounded-full cursor-pointer',
              'bg-gold text-[#0a0a1a] text-base font-bold tracking-wide',
              'shadow-2xl shadow-gold/30',
              'transition-all duration-300 hover:bg-gold-bright active:scale-[0.98]',
            )}
          >
            {step === 0 ? '입력하기' : '추가 정보 입력하기'}
          </button>
          {step === 1 && (
            <button
              type="button"
              onClick={handleSubmit}
              className={cn(
                'w-full h-11 mt-3 rounded-full cursor-pointer',
                'bg-transparent border border-gold/40 text-gold text-sm font-medium',
                'transition-all duration-300 active:scale-[0.98]',
              )}
            >
              건너뛰고 사주 보기 →
            </button>
          )}
        </div>
      )}

      {/* 폼 */}
      {showForm && (
        <div
          className={cn(
            'px-5 pt-6 pb-8 -mt-16 relative z-10 transition-opacity duration-300',
            isTransitioning ? 'opacity-0' : 'opacity-100',
          )}
        >
          {/* Step 0: 이름 + 성별 + 생년월일 + 생시 */}
          {step === 0 && (
            <>
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-gold">기본 정보</h2>
              </div>

              {/* 이름 */}
              <FormField label="성함">
                <Input
                  value={form.name}
                  onChange={updateField('name')}
                  placeholder="이름을 입력해주세요"
                />
              </FormField>

              {/* 성별 */}
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

              {/* 생년월일 */}
              <FormField label="생년월일" hint="예: 19931101 (8자리)">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={form.birthDate}
                  onChange={updateField('birthDate')}
                  placeholder="19931101"
                />
              </FormField>

              {/* 태어난 시간 (시진) */}
              <FormField label="태어난 시간" className="mb-6">
                <Select
                  value={form.shichen}
                  onChange={updateField('shichen')}
                  placeholder="시진을 선택해주세요"
                  options={SHICHEN_OPTIONS.map((opt) => ({
                    value: opt.value,
                    label: `${opt.label} (${opt.timeRange})`,
                  }))}
                />
              </FormField>

              <button
                type="button"
                onClick={handleStep0Next}
                disabled={!isStep0Valid}
                className={cn(
                  goldButton,
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                )}
              >
                다음 →
              </button>
            </>
          )}

          {/* Step 1: 지역 + 특이사항 (선택) */}
          {step === 1 && (
            <>
              <div className="text-center mb-5">
                <h2 className="text-lg font-bold text-gold">추가 정보</h2>
                <p className="text-xs text-muted mt-1">
                  선택사항이에요. 입력하면 더 정확한 풀이가 가능해요.
                </p>
              </div>

              {/* 출생 지역 */}
              <FormField
                label="출생 지역"
                hint="지역에 따라 태양시 보정이 적용돼요"
              >
                <Input
                  value={form.region}
                  onChange={updateField('region')}
                  placeholder="예: 서울, 부산, 대구"
                />
              </FormField>

              {/* 특이사항 */}
              <FormField label="특이사항" className="mb-6">
                <Textarea
                  value={form.note}
                  onChange={updateField('note')}
                  placeholder="궁금한 점이나 참고할 사항이 있다면 적어주세요"
                  rows={3}
                />
              </FormField>

              <button
                type="button"
                onClick={handleSubmit}
                className={goldButton}
              >
                사주 보기 →
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

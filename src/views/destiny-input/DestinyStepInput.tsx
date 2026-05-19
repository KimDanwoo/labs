'use client';

import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@shared/lib/cn';
import { Button } from '@shared/ui';

import { useDestinyForm, useDestinySteps } from './hooks';
import { Step0Form, Step1Form } from './ui';

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
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80 transition-colors hover:bg-background/80"
      >
        ←
      </Link>

      {/* 배경 이미지 */}
      <div
        className={cn(
          'relative w-full flex-1 min-h-0 transition-opacity duration-300',
          isTransitioning ? 'opacity-40' : 'opacity-100',
        )}
      >
        <Image
          src={currentImage}
          alt="사주 입력"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-transparent to-background pointer-events-none" />
      </div>

      {/* 버튼 상태 */}
      {!showForm && !isTransitioning && (
        <div className="flex flex-col items-center px-6 py-8 -mt-16 relative z-10">
          <Button fullWidth onClick={handleOpenForm}>
            {step === 0 ? '입력하기' : '추가 정보 입력하기'}
          </Button>
          {step === 1 && (
            <Button
              variant="outline"
              fullWidth
              onClick={handleSubmit}
              className="mt-3"
            >
              건너뛰고 사주 보기 →
            </Button>
          )}
        </div>
      )}

      {/* 폼 */}
      {showForm && (
        <div
          className={cn(
            'px-5 pt-6 pb-8 -mt-16 relative z-10',
            'transition-[opacity,transform] duration-300 ease-out',
            isTransitioning
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0',
          )}
        >
          {step === 0 && (
            <Step0Form
              form={form}
              setForm={setForm}
              updateField={updateField}
              isStep0Valid={isStep0Valid}
              onNext={handleStep0Next}
            />
          )}
          {step === 1 && (
            <Step1Form
              form={form}
              updateField={updateField}
              onSubmit={handleSubmit}
            />
          )}
        </div>
      )}
    </div>
  );
}

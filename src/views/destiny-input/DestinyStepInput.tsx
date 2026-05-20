'use client';

import Link from 'next/link';

import { useDestinyForm, useDestinySteps } from './hooks';
import { GuideScreen, Step0Form, Step1Form } from './ui';

export function DestinyStepInput() {
  const { form, setForm, updateField, isStep0Valid } = useDestinyForm();
  const {
    step,
    showForm,
    currentImage,
    handleOpenForm,
    handleStep0Next,
    handleSubmit,
  } = useDestinySteps(form);

  return (
    <div className="w-full h-dvh flex flex-col bg-background overflow-hidden">
      <Link
        href="/"
        className="absolute top-4 left-4 z-10 w-10 h-10 flex items-center justify-center rounded-full bg-background/60 backdrop-blur-sm text-foreground/80"
      >
        ←
      </Link>

      {!showForm ? (
        <GuideScreen imageSrc={currentImage} onNext={handleOpenForm} />
      ) : step === 0 ? (
        <Step0Form
          form={form}
          setForm={setForm}
          updateField={updateField}
          isStep0Valid={isStep0Valid}
          onNext={handleStep0Next}
        />
      ) : (
        <Step1Form
          form={form}
          updateField={updateField}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

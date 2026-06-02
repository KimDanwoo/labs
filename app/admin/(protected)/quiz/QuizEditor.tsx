'use client';

import { useState } from 'react';
import { ALL_CHARACTER_IDS, CHARACTERS } from '@shared/constants';
import { useDeleteQuiz, useSaveQuiz } from '@app/admin/_lib/hooks';
import type { QuizRow } from '@app/admin/_lib/types';

type QuizEditorProps = {
  row: QuizRow;
  onDone: () => void;
};

export default function QuizEditor({ row, onDone }: QuizEditorProps) {
  const [form, setForm] = useState<QuizRow>(row);
  const saveMutation = useSaveQuiz();
  const deleteMutation = useDeleteQuiz();
  const isNew = !row.id;
  const errorMessage =
    saveMutation.error?.message ?? deleteMutation.error?.message ?? null;

  const update = (patch: Partial<QuizRow>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const updateOption = (index: number, value: string) =>
    update({ options: form.options.map((o, i) => (i === index ? value : o)) });

  const addOption = () => update({ options: [...form.options, ''] });

  const removeOption = (index: number) => {
    const options = form.options.filter((_, i) => i !== index);
    const correct_index =
      form.correct_index === index
        ? 0
        : form.correct_index > index
          ? form.correct_index - 1
          : form.correct_index;
    update({ options, correct_index });
  };

  const save = () => saveMutation.mutate(form, { onSuccess: onDone });

  const remove = () => {
    if (isNew) {
      onDone();
      return;
    }
    deleteMutation.mutate(form.id, { onSuccess: onDone });
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <select
          value={form.character_id}
          onChange={(e) => update({ character_id: e.target.value })}
          className="px-2 py-1.5 rounded-lg bg-input-bg border border-card-border text-xs text-foreground outline-none"
        >
          {ALL_CHARACTER_IDS.map((id) => (
            <option key={id} value={id}>
              {CHARACTERS[id].name}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-1 text-[11px] text-muted ml-auto">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update({ is_active: e.target.checked })}
          />
          활성
        </label>
      </div>

      <textarea
        value={form.question}
        onChange={(e) => update({ question: e.target.value })}
        rows={2}
        placeholder="문제"
        className="w-full px-2.5 py-2 rounded-lg bg-input-bg border border-card-border text-sm text-foreground outline-none focus:border-gold resize-none"
      />

      <div className="space-y-1.5">
        <span className="text-[11px] text-muted">정답은 ◉ 선택</span>
        {form.options.map((opt, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="radio"
              name={`correct-${form.id || 'new'}`}
              checked={form.correct_index === i}
              onChange={() => update({ correct_index: i })}
              className="shrink-0"
            />
            <input
              value={opt}
              onChange={(e) => updateOption(i, e.target.value)}
              placeholder={`보기 ${i + 1}`}
              className="w-full px-2 py-1.5 rounded-md bg-input-bg border border-card-border text-xs text-foreground outline-none focus:border-gold"
            />
            <button
              onClick={() => removeOption(i)}
              className="text-[11px] text-red btn-press shrink-0"
            >
              삭제
            </button>
          </div>
        ))}
        <button
          onClick={addOption}
          className="text-[11px] text-muted hover:text-foreground btn-press"
        >
          + 보기 추가
        </button>
      </div>

      <textarea
        value={form.fact}
        onChange={(e) => update({ fact: e.target.value })}
        rows={2}
        placeholder="정답 해설"
        className="w-full px-2.5 py-2 rounded-lg bg-input-bg border border-card-border text-xs text-foreground outline-none focus:border-gold resize-none"
      />

      <div className="flex items-center justify-end gap-2">
        {errorMessage && (
          <span className="text-[11px] text-red">{errorMessage}</span>
        )}
        <button
          onClick={remove}
          disabled={deleteMutation.isPending}
          className="px-3 py-1.5 text-xs text-red btn-press disabled:opacity-40"
        >
          {isNew ? '취소' : '삭제'}
        </button>
        <button
          onClick={save}
          disabled={saveMutation.isPending}
          className="btn-primary bg-gold btn-press px-4 py-1.5 text-xs disabled:opacity-40"
        >
          {saveMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </div>
  );
}

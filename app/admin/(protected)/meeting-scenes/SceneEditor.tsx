'use client';

import { useState } from 'react';
import { ALL_CHARACTER_IDS, CHARACTERS } from '@shared/constants';
import {
  useDeleteMeetingScene,
  useSaveMeetingScene,
} from '@app/admin/_lib/hooks';
import type { MeetingOption, MeetingSceneRow } from '@app/admin/_lib/types';

const CATEGORIES = [
  'food',
  'hobby',
  'compliment',
  'comfort',
  'plan',
  'small-talk',
];

const OUTCOMES: MeetingOption['outcome'][] = ['good', 'ok', 'awkward'];
const OUTCOME_LABEL: Record<MeetingOption['outcome'], string> = {
  good: '좋음',
  ok: '보통',
  awkward: '어색',
};

type SceneEditorProps = {
  row: MeetingSceneRow;
  onDone: () => void;
};

export default function SceneEditor({ row, onDone }: SceneEditorProps) {
  const [form, setForm] = useState<MeetingSceneRow>(row);
  const saveMutation = useSaveMeetingScene();
  const deleteMutation = useDeleteMeetingScene();
  const isNew = !row.id;
  const errorMessage =
    saveMutation.error?.message ?? deleteMutation.error?.message ?? null;

  const update = (patch: Partial<MeetingSceneRow>) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const updateOption = (index: number, patch: Partial<MeetingOption>) =>
    update({
      options: form.options.map((o, i) => (i === index ? { ...o, ...patch } : o)),
    });

  const addOption = () =>
    update({
      options: [...form.options, { text: '', outcome: 'ok', reaction: '' }],
    });

  const removeOption = (index: number) =>
    update({ options: form.options.filter((_, i) => i !== index) });

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
          className="admin-select px-2 py-1.5 rounded-lg bg-input-bg border border-card-border text-xs text-foreground outline-none"
        >
          {ALL_CHARACTER_IDS.map((id) => (
            <option key={id} value={id}>
              {CHARACTERS[id].name}
            </option>
          ))}
        </select>
        <select
          value={form.category}
          onChange={(e) => update({ category: e.target.value })}
          className="admin-select px-2 py-1.5 rounded-lg bg-input-bg border border-card-border text-xs text-foreground outline-none"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
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
        value={form.prompt}
        onChange={(e) => update({ prompt: e.target.value })}
        rows={2}
        placeholder="상대가 거는 말"
        className="w-full px-2.5 py-2 rounded-lg bg-input-bg border border-card-border text-sm text-foreground outline-none focus:border-gold resize-none"
      />

      <div className="space-y-2">
        {form.options.map((opt, i) => (
          <div key={i} className="rounded-lg border border-card-border p-2 space-y-1.5">
            <div className="flex items-center gap-1.5">
              <select
                value={opt.outcome}
                onChange={(e) =>
                  updateOption(i, {
                    outcome: e.target.value as MeetingOption['outcome'],
                  })
                }
                className="admin-select px-2 py-1 rounded-md bg-input-bg border border-card-border text-[11px] text-foreground outline-none"
              >
                {OUTCOMES.map((o) => (
                  <option key={o} value={o}>
                    {OUTCOME_LABEL[o]}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeOption(i)}
                className="ml-auto text-[11px] text-red btn-press"
              >
                삭제
              </button>
            </div>
            <input
              value={opt.text}
              onChange={(e) => updateOption(i, { text: e.target.value })}
              placeholder="선택지 문구"
              className="w-full px-2 py-1.5 rounded-md bg-input-bg border border-card-border text-xs text-foreground outline-none focus:border-gold"
            />
            <input
              value={opt.reaction}
              onChange={(e) => updateOption(i, { reaction: e.target.value })}
              placeholder="상대 반응"
              className="w-full px-2 py-1.5 rounded-md bg-input-bg border border-card-border text-xs text-foreground outline-none focus:border-gold"
            />
          </div>
        ))}
        <button
          onClick={addOption}
          className="text-[11px] text-muted hover:text-foreground btn-press"
        >
          + 선택지 추가
        </button>
      </div>

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

'use client';

import { useState } from 'react';
import { useSaveCharacter } from '@features/admin/model/hooks';
import type { CharacterRow } from '@features/admin/model/types';

const COLOR_FIELDS = [
  { key: 'color', label: '본문' },
  { key: 'bg_color', label: '배경' },
  { key: 'border_color', label: '테두리' },
] as const;

type CharacterEditorProps = {
  row: CharacterRow;
  onDone: () => void;
};

export default function CharacterEditor({ row, onDone }: CharacterEditorProps) {
  const [form, setForm] = useState<CharacterRow>(row);
  const saveMutation = useSaveCharacter();

  const update = (patch: Partial<CharacterRow>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const save = () => saveMutation.mutate(form, { onSuccess: onDone });

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{form.emoji}</span>
        <span className="text-sm font-bold text-foreground">{form.id}</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="space-y-1">
          <span className="text-[11px] text-muted">이름</span>
          <input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            className="w-full px-2.5 py-2 rounded-lg bg-input-bg border border-card-border text-sm text-foreground outline-none focus:border-gold"
          />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] text-muted">이모지</span>
          <input
            value={form.emoji}
            onChange={(e) => update({ emoji: e.target.value })}
            className="w-full px-2.5 py-2 rounded-lg bg-input-bg border border-card-border text-sm text-foreground outline-none focus:border-gold"
          />
        </label>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {COLOR_FIELDS.map(({ key, label }) => (
          <label key={key} className="space-y-1">
            <span className="text-[11px] text-muted">{label}</span>
            <div className="flex items-center gap-1.5">
              <input
                type="color"
                value={form[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-7 h-7 rounded border border-card-border bg-transparent p-0 shrink-0"
              />
              <input
                value={form[key]}
                onChange={(e) => update({ [key]: e.target.value })}
                className="w-full min-w-0 px-1.5 py-1 rounded-lg bg-input-bg border border-card-border text-[11px] text-foreground outline-none focus:border-gold"
              />
            </div>
          </label>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2">
        {saveMutation.error && (
          <span className="text-[11px] text-red">
            {saveMutation.error.message}
          </span>
        )}
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

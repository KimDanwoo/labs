'use client';

import { ALL_CHARACTER_IDS, CHARACTERS } from '@shared/constants';

type CharacterTabsProps = {
  value: string;
  onChange: (id: string) => void;
};

export default function CharacterTabs({ value, onChange }: CharacterTabsProps) {
  return (
    <div className="flex gap-1 flex-wrap">
      {ALL_CHARACTER_IDS.map((id) => {
        const isActive = value === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold btn-press transition-colors ${
              isActive
                ? 'bg-gold text-white'
                : 'bg-input-bg text-muted border border-card-border'
            }`}
          >
            {CHARACTERS[id].emoji} {CHARACTERS[id].name}
          </button>
        );
      })}
    </div>
  );
}

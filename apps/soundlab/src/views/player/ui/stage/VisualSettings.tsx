import { useAtom } from 'jotai';
import type { JSX } from 'react';
import { isVisualMode, VISUAL_LABEL, VISUAL_MODE, visualModeAtom } from '../../model/visual';

export function VisualSettings(): JSX.Element {
  const [mode, setMode] = useAtom(visualModeAtom);
  return (
    <label className="flex items-center gap-xs text-xs text-dim">
      <span>화면</span>
      <select
        aria-label="시각 효과"
        value={mode}
        onChange={(event) => {
          if (isVisualMode(event.currentTarget.value)) setMode(event.currentTarget.value);
        }}
        className="rounded-sm border border-hairline bg-void px-xs py-xs text-paper outline-none focus-visible:ring-2 focus-visible:ring-brass"
      >
        {Object.values(VISUAL_MODE).map((value) => (
          <option key={value} value={value}>
            {VISUAL_LABEL[value]}
          </option>
        ))}
      </select>
    </label>
  );
}

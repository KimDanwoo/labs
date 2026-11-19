import { useId, type JSX } from 'react';
import { SCHOOLMATE_GREETING } from '../config/schoolmate';
import { TIME, type TimeOfDay } from '../config/walk';
import { gameKey } from '../lib/input';
import { useModal } from '../model/hooks/useModal';
import { type SchoolRegion } from '../model/schoolmateRoster';
import { Icon } from './Icon';

interface SchoolmateDialogProps {
  name: string;
  region: SchoolRegion;
  time: TimeOfDay;
  canPlay: boolean;
  onPlay: () => void;
  onClose: () => void;
}

export function SchoolmateDialog({ name, region, time, canPlay, onPlay, onClose }: SchoolmateDialogProps): JSX.Element {
  const ref = useModal(true);
  const titleId = useId();
  return (
    <dialog
      className="map-dialog schoolmate-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
      onKeyDown={(event) => {
        if (gameKey(event) === 'e' && !event.repeat) {
          event.preventDefault();
          event.stopPropagation();
          onClose();
        }
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">학교에서 만난 친구</span>
          <h2 id={titleId}>{name}의 인사</h2>
        </div>
        <button className="tool" aria-label="친구 인사 닫기" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p>{time === TIME.evening ? '노을이 예뻐서 조금 더 있다 가려고.' : '어, 너도 학교에 놀러 왔구나!'}</p>
      <p>{SCHOOLMATE_GREETING[region]}</p>
      <div className="schoolmate-actions">
        {canPlay && (
          <button className="wardrobe-done" onClick={onPlay}>
            공 주고받기
          </button>
        )}
        <button className="wardrobe-done" onClick={onClose}>
          또 보자 <kbd>E</kbd>
        </button>
      </div>
    </dialog>
  );
}

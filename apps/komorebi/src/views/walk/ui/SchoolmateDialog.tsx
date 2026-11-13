import { useId, type JSX } from 'react';
import { gameKey } from '../lib/input';
import { TIME, type TimeOfDay } from '../model/constants/walk';
import { useModal } from '../model/hooks/useModal';
import { SCHOOL_REGION, type SchoolRegion } from '../model/schoolmates';
import { Icon } from './Icon';

type Props = {
  name: string;
  region: SchoolRegion;
  time: TimeOfDay;
  canPlay: boolean;
  onPlay: () => void;
  onClose: () => void;
};
const GREETING = {
  [SCHOOL_REGION.yard]: '방학이라 운동장이 우리 둘 거네. 같이 공 던질래?',
  [SCHOOL_REGION.hallway]: '복도가 조용하니까 발소리가 멀리까지 들려. 우리 교실도 가 보자.',
  [SCHOOL_REGION.classroom]: '우리 교실 냄새, 그대로다. 칠판에 여름 이야기를 남겨 볼까?',
} satisfies Record<SchoolRegion, string>;

export function SchoolmateDialog({ name, region, time, canPlay, onPlay, onClose }: Props): JSX.Element {
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
      <p>{GREETING[region]}</p>
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

import { useId, type JSX } from 'react';
import { SCHOOLMATE_GREETING } from '../config/schoolmate';
import { TIME } from '../config/walk';
import { gameKey } from '../lib/input';
import { useModal } from '../model/hooks/useModal';
import { useWalkContext } from '../model/hooks/useWalkContext';
import type { SCHOOLMATES, SchoolRegion } from '../model/schoolmateRoster';
import { DialogHeading } from './DialogHeading';

interface SchoolmateDialogProps {
  friend: (typeof SCHOOLMATES)[number];
  region: SchoolRegion;
}

export function SchoolmateDialog({ friend, region }: SchoolmateDialogProps): JSX.Element {
  const { timeOfDay: time, canPlayBall: canPlay, activities } = useWalkContext();
  const name = friend.name;
  const onClose = activities.closeFriend;
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
      <DialogHeading
        eyebrow="학교에서 만난 친구"
        title={`${name}의 인사`}
        titleId={titleId}
        closeLabel="친구 인사 닫기"
        onClose={onClose}
      />
      <p>{time === TIME.evening ? '노을이 예뻐서 조금 더 있다 가려고.' : '어, 너도 학교에 놀러 왔구나!'}</p>
      <p>{SCHOOLMATE_GREETING[region]}</p>
      <div className="schoolmate-actions">
        {canPlay && (
          <button className="wardrobe-done" onClick={() => activities.playBall(friend)}>
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

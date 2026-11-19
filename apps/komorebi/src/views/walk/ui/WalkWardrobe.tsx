import { useId, type JSX } from 'react';
import { DIALOG } from '../config/walk';
import { useModal } from '../model/hooks/useModal';
import { useWalkContext } from '../model/hooks/useWalkContext';
import { useWardrobe } from '../model/hooks/useWardrobe';
import { DialogHeading } from './DialogHeading';
import { Icon } from './Icon';
import { WardrobeBody } from './wardrobe/WardrobeBody';

export function WalkWardrobe(): JSX.Element {
  const { dialog, appearance, changeAppearance, closeDialog } = useWalkContext();
  const isOpen = dialog === DIALOG.wardrobe;
  const ref = useModal(isOpen);
  const titleId = useId();
  const { isChanging, error, choose } = useWardrobe(isOpen, changeAppearance);
  const handleClose = () => closeDialog(DIALOG.wardrobe);

  return (
    <dialog
      className="map-dialog wardrobe-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={handleClose}
      onClose={(event) => {
        if (!event.currentTarget.open) handleClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <DialogHeading
        eyebrow="오늘의 산책 준비"
        title="나의 작은 옷장"
        titleId={titleId}
        closeLabel="옷장 닫기"
        onClose={handleClose}
      />
      <p className="dialog-intro">밀짚모자를 쓰고, 오늘도 한 걸음.</p>
      <WardrobeBody appearance={appearance} isChanging={isChanging} onChoose={choose} />
      <p className="wardrobe-status" role="status">
        {error || (isChanging ? '옷을 갈아입고 있어요…' : '고른 모습은 다음 산책에도 그대로예요.')}
      </p>
      <button className="wardrobe-done" disabled={isChanging} onClick={handleClose}>
        이 모습으로 산책하기 <Icon name="arrow" />
      </button>
    </dialog>
  );
}

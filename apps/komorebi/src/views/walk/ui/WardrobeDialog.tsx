import { useId, useState, type JSX } from 'react';
import { useModal } from '../model/hooks/useModal';
import { OUTFIT_DEFINITIONS, type Appearance } from '../model/world/appearance';
import { CharacterPreview } from './CharacterPreview';
import { Icon } from './Icon';

type Props = {
  isOpen: boolean;
  appearance: Appearance;
  onChange: (next: Appearance) => Promise<boolean>;
  onClose: () => void;
};

export function WardrobeDialog({ isOpen, appearance, onChange, onClose }: Props): JSX.Element {
  const ref = useModal(isOpen);
  const titleId = useId();
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState('');
  async function choose(next: Appearance) {
    if (isChanging) return;
    setIsChanging(true);
    setError('');
    try {
      if (!(await onChange(next))) setError('옷을 꺼내지 못했어요. 다시 골라 주세요.');
    } finally {
      setIsChanging(false);
    }
  }
  return (
    <dialog
      className="map-dialog wardrobe-dialog"
      ref={ref}
      aria-labelledby={titleId}
      onCancel={onClose}
      onClose={(event) => {
        if (!event.currentTarget.open) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-heading">
        <div>
          <span className="eyebrow">오늘의 산책 준비</span>
          <h2 id={titleId}>나의 작은 옷장</h2>
        </div>
        <button className="tool" aria-label="옷장 닫기" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <p className="dialog-intro">밀짚모자를 쓰고, 오늘도 한 걸음.</p>
      <div className="wardrobe-body" aria-busy={isChanging}>
        <div className="wardrobe-mirror">
          <CharacterPreview appearance={appearance} />
          <span>오늘의 나</span>
        </div>
        <div className="wardrobe-choices">
          <fieldset disabled={isChanging}>
            <legend>오늘 입을 옷</legend>
            <div className="wardrobe-options">
              {Object.values(OUTFIT_DEFINITIONS).map((outfit) => (
                <button
                  key={outfit.id}
                  aria-pressed={appearance.outfit === outfit.id}
                  onClick={() => void choose({ ...appearance, outfit: outfit.id })}
                >
                  <CharacterPreview appearance={{ ...appearance, outfit: outfit.id }} />
                  <strong>{outfit.name}</strong>
                  <small>{outfit.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
        </div>
      </div>
      <p className="wardrobe-status" role="status">
        {error || (isChanging ? '옷을 갈아입고 있어요…' : '고른 모습은 다음 산책에도 그대로예요.')}
      </p>
      <button className="wardrobe-done" disabled={isChanging} onClick={onClose}>
        이 모습으로 산책하기 <Icon name="arrow" />
      </button>
    </dialog>
  );
}

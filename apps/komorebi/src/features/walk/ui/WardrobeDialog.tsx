import { useModal } from '@features/walk/model/hooks';
import { CHARACTER, OUTFIT, type Appearance } from '@shared/world/appearance';
import { useId, useState } from 'react';
import { CharacterPreview } from './CharacterPreview';
import { Icon } from './Icon';

type Props = {
  isOpen: boolean;
  appearance: Appearance;
  onChange: (next: Appearance) => Promise<boolean>;
  onClose: () => void;
};
const TEMPLATES = [
  { id: CHARACTER.boy, name: '남자', detail: '짧은 바가지머리' },
  { id: CHARACTER.girl, name: '여자', detail: '허리까지 긴 생머리' },
];
const OUTFITS = [
  { id: OUTFIT.summer, name: '레몬빛 여름옷', detail: '노란 티셔츠와 산호색 반바지' },
  { id: OUTFIT.overalls, name: '풀잎 멜빵옷', detail: '작은 꽃이 달린 초록 멜빵' },
];

export function WardrobeDialog({ isOpen, appearance, onChange, onClose }: Props) {
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
      <p className="dialog-intro">마음에 드는 모습으로, 오늘도 한 걸음.</p>
      <div className="wardrobe-body" aria-busy={isChanging}>
        <div className="wardrobe-mirror">
          <CharacterPreview appearance={appearance} />
          <span>오늘의 나</span>
        </div>
        <div className="wardrobe-choices">
          <fieldset disabled={isChanging}>
            <legend>캐릭터</legend>
            <div className="wardrobe-options">
              {TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  aria-pressed={appearance.character === template.id}
                  onClick={() => void choose({ ...appearance, character: template.id })}
                >
                  <CharacterPreview appearance={{ ...appearance, character: template.id }} />
                  <strong>{template.name}</strong>
                  <small>{template.detail}</small>
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset disabled={isChanging}>
            <legend>오늘 입을 옷</legend>
            <div className="wardrobe-options">
              {OUTFITS.map((outfit) => (
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

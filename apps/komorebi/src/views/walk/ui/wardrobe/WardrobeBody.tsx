import { OUTFIT_DEFINITIONS, type Appearance } from '../../model/world/appearance';
import { CharacterPreview } from '../CharacterPreview';
import { OutfitOption } from './OutfitOption';

interface WardrobeBodyProps {
  appearance: Appearance;
  isChanging: boolean;
  onChoose: (next: Appearance) => Promise<void>;
}

export function WardrobeBody({ appearance, isChanging, onChoose }: WardrobeBodyProps) {
  return (
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
              <OutfitOption key={outfit.id} outfit={outfit} appearance={appearance} onChoose={onChoose} />
            ))}
          </div>
        </fieldset>
      </div>
    </div>
  );
}

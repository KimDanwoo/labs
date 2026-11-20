import { AQUARIUM_ART, aquariumFishArt } from '@views/walk/lib/aquarium';
import type { KeptFish } from '@views/walk/lib/companions';
import { FISH } from '@views/walk/lib/fishTable';
import { useAquariumSwim } from '@views/walk/model/hooks/useAquariumSwim';
import { useState } from 'react';

interface AquariumViewProps {
  fish: KeptFish[];
  isFeeding: boolean;
}

export function AquariumView({ fish, isFeeding }: AquariumViewProps) {
  const root = useAquariumSwim(fish, isFeeding);
  const [selected, setSelected] = useState<string | null>(null);
  const chosen = fish.find((item) => item.uid === selected);
  const species = FISH.find((item) => item.id === chosen?.id);
  let caption = fish.length
    ? '물고기에 손을 올리면 잠깐 멈춰요. 눌러서 만나 보세요.'
    : '작은 바다가 새 친구를 기다리고 있어요.';
  if (chosen && species) caption = `${species.name} · ${chosen.size} cm · ${species.rarity} 만남`;
  return (
    <div className="aquarium-gallery">
      <div className="aquarium-art" ref={root} style={{ backgroundImage: `url(${AQUARIUM_ART})` }}>
        {fish.map((item, index) => (
          <button
            className="aquarium-swimmer"
            data-fish-index={index}
            key={item.uid}
            aria-pressed={selected === item.uid}
            aria-label={`${FISH.find((entry) => entry.id === item.id)?.name}, ${item.size} cm 자세히 보기`}
            onClick={() => setSelected(item.uid)}
          >
            <img src={aquariumFishArt(item.id).src} alt="" draggable={false} />
          </button>
        ))}
        {isFeeding && (
          <div className="aquarium-feed" aria-hidden="true">
            · · · · ·
          </div>
        )}
        <div className="aquarium-glimmer" aria-hidden="true" />
      </div>
      <p className="aquarium-caption" aria-live="polite">
        {caption}
      </p>
    </div>
  );
}

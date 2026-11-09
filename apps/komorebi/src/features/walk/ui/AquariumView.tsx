import { useEffect, useRef, useState } from 'react';
import { AQUARIUM_ART, aquariumFishArt, aquariumPose } from '../lib/aquarium';
import type { KeptFish } from '../lib/companions';
import { FISH } from '../lib/fishing';

export function AquariumView({ fish, isFeeding }: { fish: KeptFish[]; isFeeding: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    const swimmers = Array.from(root.current?.querySelectorAll<HTMLElement>('[data-fish-index]') ?? []);
    const swimTimes = fish.map(() => start / 1000);
    let previous = start;
    let frame = 0;
    const update = (now: number) => {
      const elapsed = (now - start) / 1000;
      const delta = Math.min(0.1, (now - previous) / 1000);
      previous = now;
      fish.forEach((item, index) => {
        const node = swimmers[index];
        if (!node || node.matches(':hover, :focus-visible')) return;
        swimTimes[index] = (swimTimes[index] ?? start / 1000) + delta;
        const pose = aquariumPose(item, swimTimes[index], isFeeding ? elapsed : 10, motion.matches);
        node.style.left = `${pose.x * 100}%`;
        node.style.top = `${pose.y * 100}%`;
        node.style.width = `${pose.width * 100}%`;
        node.style.transform = `translate(-50%, -50%) scaleX(${pose.facing}) rotate(${pose.tilt}rad)`;
      });
      if (!motion.matches && fish.length) frame = requestAnimationFrame(update);
    };
    const restart = () => {
      cancelAnimationFrame(frame);
      update(performance.now());
    };
    restart();
    motion.addEventListener('change', restart);
    return () => {
      cancelAnimationFrame(frame);
      motion.removeEventListener('change', restart);
    };
  }, [fish, isFeeding]);
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
            {/* Local painted sprites preserve their transparent silhouette. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
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

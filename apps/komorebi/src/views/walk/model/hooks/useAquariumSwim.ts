import { useEffect, useRef } from 'react';

import { AQUARIUM_MOTION } from '@views/walk/config/aquarium';
import { MS_PER_SECOND } from '@views/walk/config/time';
import { aquariumPose } from '@views/walk/lib/aquarium';
import type { KeptFish } from '@views/walk/lib/companions';

export function useAquariumSwim(fish: KeptFish[], isFeeding: boolean) {
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const start = performance.now();
    const swimmers = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[data-fish-index]') ?? []);
    const swimTimes = fish.map(() => start / MS_PER_SECOND);
    let previous = start;
    let frame = 0;
    const update = (now: number) => {
      const elapsed = (now - start) / MS_PER_SECOND;
      const delta = Math.min(AQUARIUM_MOTION.maxFrameSeconds, (now - previous) / MS_PER_SECOND);
      previous = now;
      fish.forEach((item, index) => {
        const node = swimmers[index];
        if (!node) return;
        if (node.matches(':hover, :focus-visible')) return;
        swimTimes[index] = (swimTimes[index] ?? start / MS_PER_SECOND) + delta;
        const feedTime = isFeeding ? elapsed : AQUARIUM_MOTION.restingFeedSeconds;
        const pose = aquariumPose(item, swimTimes[index], feedTime, motion.matches);
        node.style.left = `${pose.x * 100}%`;
        node.style.top = `${pose.y * 100}%`;
        node.style.width = `${pose.width * 100}%`;
        node.style.transform = `translate(-50%, -50%) scaleX(${pose.facing}) rotate(${pose.tilt}rad)`;
      });
      const shouldSwim = !motion.matches && fish.length;
      if (shouldSwim) frame = requestAnimationFrame(update);
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
  return rootRef;
}

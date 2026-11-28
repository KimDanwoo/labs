import Image from 'next/image';
import { useRef } from 'react';

import { cn } from '@shared/lib/cn';
import { MOODS, RIVAL_IMAGE } from '@views/gostop/config/rival';
import { rivalAlt, rivalImageSrc } from '@views/gostop/lib/rivalView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useMoodHop } from '@views/gostop/model/hooks/useMoodHop';
import styles from '@views/gostop/styles/rival.module.css';

interface RivalAvatarProps {
  className?: string;
}

export function RivalAvatar({ className }: RivalAvatarProps) {
  const { rivalMood, isReducedMotion } = useGostopContext();
  const frameRef = useRef<HTMLSpanElement>(null);
  useMoodHop(frameRef, rivalMood, isReducedMotion);

  return (
    <span ref={frameRef} className={cn(styles.frame, 'shrink-0', className)}>
      <span className={styles.zoom}>
        {MOODS.map((mood) => (
          <Image
            key={mood}
            src={rivalImageSrc(mood)}
            alt={mood === rivalMood ? rivalAlt(mood) : ''}
            fill
            sizes={RIVAL_IMAGE.sizes}
            loading="eager"
            draggable={false}
            data-active={mood === rivalMood}
            className={cn(styles.face, 'object-cover select-none')}
          />
        ))}
      </span>
    </span>
  );
}

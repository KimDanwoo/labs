'use client';

import { cn } from '@shared/lib/cn';

import { useScrubber } from '@views/player/model/hooks/useScrubber';
import styles from '@views/player/ui/transport/Scrubber.module.css';

export function Scrubber() {
  const { barRef, handlePointerDown, handleMouseDown, handleKeyDown } = useScrubber();

  return (
    <div
      ref={barRef}
      role="slider"
      aria-label="재생 위치"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={0}
      tabIndex={0}
      className={cn(styles.bar, 'relative flex h-[14px] cursor-pointer touch-none items-center')}
      onPointerDown={handlePointerDown}
      onMouseDown={handleMouseDown}
      onKeyDown={handleKeyDown}
    >
      <span aria-hidden className="bg-hairline absolute inset-x-0 h-[2px]" />
      <span aria-hidden className={cn(styles.buffered, 'bg-mute absolute inset-x-0 h-[2px] origin-left')} />
      <span aria-hidden className={cn(styles.progress, 'bg-paper absolute inset-x-0 h-[2px] origin-left')} />
      <span aria-hidden className={cn(styles.thumb, 'bg-paper absolute left-0 size-[7px] rounded-full')} />
    </div>
  );
}

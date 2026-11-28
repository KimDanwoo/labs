import { cn } from '@shared/lib/cn';
import { DEAL_STAGGER_MS, FLOOR_STACK_STEP_PERCENT, FRESH_CARD } from '@views/gostop/config/cardStyle';
import { entranceOf, isFreshCard } from '@views/gostop/lib/view';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/hwatuMotion.module.css';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';
import { useState } from 'react';

interface FloorCardProps {
  id: number;
  stack: number;
  slot: number;
}

export function FloorCard({ id, stack, slot }: FloorCardProps) {
  const { lastTurn } = useGostopContext();
  const [entrance] = useState(() => entranceOf(id, lastTurn));
  const isFresh = isFreshCard(id, lastTurn);
  const delay = entrance === 'deal' ? slot * DEAL_STAGGER_MS : 0;

  return (
    <span
      className={cn('absolute inset-x-0 top-0', styles[entrance])}
      style={{
        transform: `translateY(${stack * FLOOR_STACK_STEP_PERCENT}%)`,
        animationDelay: `${delay}ms`,
      }}
    >
      <HwatuCard id={id} className={isFresh ? FRESH_CARD : undefined} />
    </span>
  );
}

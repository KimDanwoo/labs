import { cn } from '@shared/lib/cn';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { GatherGlow } from '@views/gostop/ui/GatherGlow';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface FloorCardProps {
  id: number;
  isStacked: boolean;
}

export function FloorCard({ id, isStacked }: FloorCardProps) {
  const { gathering } = useGostopContext();
  const isGathering = gathering.has(id);
  const stackClass = isGathering ? styles.gathered : styles.stacked;

  return (
    <div data-card={id} className={cn(styles.floorCard, isStacked && stackClass)}>
      <HwatuCard id={id} className="shadow-[0_3px_8px_rgb(0_0_0/0.45)]" />
      {isGathering && <GatherGlow />}
    </div>
  );
}

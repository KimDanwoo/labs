import { cn } from '@shared/lib/cn';
import { floorPose, poseStyle } from '@views/gostop/lib/floorPose';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { GatherGlow } from '@views/gostop/ui/GatherGlow';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface FloorCardProps {
  id: number;
  stackIndex: number;
}

export function FloorCard({ id, stackIndex }: FloorCardProps) {
  const { gathering } = useGostopContext();
  const isGathering = gathering.has(id);
  const isStacked = stackIndex > 0;
  const stackClass = isGathering ? styles.gathered : styles.stacked;

  return (
    <div data-card={id} className={cn(styles.floorCard, isStacked && stackClass)}>
      <span className={styles.pose} style={poseStyle(floorPose(id, stackIndex, isGathering))}>
        <HwatuCard id={id} className="shadow-[0_1px_0_rgb(0_0_0/0.35),0_6px_12px_-2px_rgb(0_0_0/0.55)]" />
        {isGathering && <GatherGlow />}
      </span>
    </div>
  );
}

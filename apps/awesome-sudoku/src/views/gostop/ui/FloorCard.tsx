import { cn } from '@shared/lib/cn';
import { choiceRoleOf, floorCardPose } from '@views/gostop/lib/choice';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';
import { ChoicePick } from '@views/gostop/ui/ChoicePick';
import { GatherGlow } from '@views/gostop/ui/GatherGlow';
import { HwatuCard } from '@views/gostop/ui/HwatuCard';

interface FloorCardProps {
  id: number;
  stackIndex: number;
}

export function FloorCard({ id, stackIndex }: FloorCardProps) {
  const { gathering, choice } = useGostopContext();
  const isGathering = gathering.has(id);
  const role = choiceRoleOf(choice, id);
  const isStacked = stackIndex > 0;
  const stackClass = isGathering ? styles.gathered : styles.stacked;

  return (
    <div data-card={id} data-choice={role} className={cn(styles.floorCard, isStacked && stackClass)}>
      <span className={styles.pose} style={floorCardPose(id, stackIndex, isGathering, role)}>
        <HwatuCard id={id} className="shadow-[0_1px_0_rgb(0_0_0/0.35),0_6px_12px_-2px_rgb(0_0_0/0.55)]" />
        {isGathering && <GatherGlow />}
        {role === 'candidate' && <ChoicePick id={id} />}
      </span>
    </div>
  );
}

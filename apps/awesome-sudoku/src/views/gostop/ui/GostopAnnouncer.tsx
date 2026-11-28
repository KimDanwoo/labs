import { bonusAnnouncement } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function GostopAnnouncer() {
  const { announcement, bonus } = useGostopContext();

  return (
    <p role="status" className="sr-only">
      <span>{announcement}</span>
      <span>{bonusAnnouncement(bonus)}</span>
    </p>
  );
}

import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { BonusToast } from '@views/gostop/ui/BonusToast';

export function GostopBonus() {
  const { bonus, dismissBonus } = useGostopContext();
  if (!bonus) return null;

  return <BonusToast key={bonus.date} bonus={bonus} onDismiss={dismissBonus} />;
}

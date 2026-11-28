import { cn } from '@shared/lib/cn';
import { BOARD_COPY, RISK_LABEL } from '@views/gostop/config/copy';
import { RISK_CHIP } from '@views/gostop/config/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/hwatuMotion.module.css';

export function RiskChips() {
  const { risks } = useGostopContext();

  return (
    <ul aria-label={BOARD_COPY.risks} className="flex flex-wrap gap-1">
      {risks.map((risk) => (
        <li key={risk} className={cn(RISK_CHIP, styles.pulse)}>
          {RISK_LABEL[risk]}
        </li>
      ))}
    </ul>
  );
}

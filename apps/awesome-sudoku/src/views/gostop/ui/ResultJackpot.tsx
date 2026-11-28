import { COIN_RAIN } from '@views/gostop/config/purse';
import { coinRainStyle } from '@views/gostop/lib/coinMotion';
import { allInMoodOf } from '@views/gostop/lib/moneyView';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/money.module.css';
import { CoinGlyph } from '@views/gostop/ui/CoinGlyph';

export function ResultJackpot() {
  const { settlement } = useGostopContext();
  if (allInMoodOf(settlement) !== 'jackpot') return null;

  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <span className={styles.jackpotRays} />
      {COIN_RAIN.map((drop) => (
        <span key={drop.left} className={styles.rain} style={coinRainStyle(drop)}>
          <CoinGlyph className="size-full" />
        </span>
      ))}
    </span>
  );
}

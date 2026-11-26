import { QUICK_NUMBERS } from '@views/game-library/config/quickPuzzle';
import styles from '@views/game-library/ui/GameLibrary.module.css';

interface QuickSudokuKeysProps {
  canEnter: boolean;
  onNumber: (value: number) => void;
}

export function QuickSudokuKeys({ canEnter, onNumber }: QuickSudokuKeysProps) {
  return (
    <div className={styles.keypad} role="group" aria-label="빈칸에 넣을 숫자">
      {QUICK_NUMBERS.map((value) => (
        <button key={value} type="button" onClick={() => onNumber(value)} disabled={!canEnter}>
          {value}
        </button>
      ))}
    </div>
  );
}

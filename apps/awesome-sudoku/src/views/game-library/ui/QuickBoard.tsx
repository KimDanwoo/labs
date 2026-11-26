import type { QuickRows, QuickSudokuMode, QuickSudokuState } from '@views/game-library/config/quickPuzzle';
import styles from '@views/game-library/ui/GameLibrary.module.css';
import { QuickCageMarks } from '@views/game-library/ui/QuickCageMarks';

interface QuickBoardProps {
  mode: QuickSudokuMode;
  rows: QuickRows;
  selection: QuickSudokuState;
  onSelect: (id: string) => void;
}

export function QuickBoard({ mode, rows, selection, onSelect }: QuickBoardProps) {
  const boardLabel = mode === 'killer' ? '6×6 킬러 스도쿠 판' : '6×6 미니 스도쿠 판';
  const isSolved = selection.result === 'solved';

  return (
    <table className={styles.quickBoard} aria-label={boardLabel}>
      <tbody>
        {rows.map((row) => (
          <tr key={row.id}>
            {row.cells.map((cell) => {
              const value = selection.entries[cell.id];
              const location = `${cell.row}행 ${cell.column}열`;

              const cageLabel = cell.cage ? `, ${cell.cage.name} 구역 합 ${cell.cage.total}` : '';

              return (
                <td key={cell.id} data-editable={cell.isBlank} data-cage={Boolean(cell.cage)}>
                  {cell.cage ? <QuickCageMarks cage={cell.cage} /> : null}
                  {cell.isBlank ? (
                    <button
                      type="button"
                      aria-label={`${location} ${value ?? '빈칸'}${cageLabel}`}
                      aria-pressed={selection.active === cell.id && !isSolved}
                      disabled={isSolved}
                      onClick={() => onSelect(cell.id)}
                    >
                      {value}
                    </button>
                  ) : (
                    cell.value
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

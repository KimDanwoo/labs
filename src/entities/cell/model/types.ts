export interface SudokuCell {
  value: number | null;
  isInitial: boolean;
  isSelected: boolean;
  isConflict: boolean;
  notes: number[];
}

export interface CellProps {
  cell: SudokuCell;
  row: number;
  col: number;
  onSelect: (row: number, col: number) => void;
}

export interface CellHighlight {
  selected: boolean;
  related: boolean;
  sameValue: boolean;
}

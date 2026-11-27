import { memo } from 'react';

import { NUMBER_BUTTON } from '@entities/sudoku/config/board';

interface NumberButtonProps {
  value: number;
  onClick: () => void;
  isDisabled: boolean;
}

export const NumberButton = memo(({ value, onClick, isDisabled }: NumberButtonProps) => (
  <button type="button" className={NUMBER_BUTTON} aria-label={`숫자 ${value}`} onClick={onClick} disabled={isDisabled}>
    {value}
  </button>
));

NumberButton.displayName = 'NumberButton';

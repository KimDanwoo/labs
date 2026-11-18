import { X } from 'lucide-react';

import { Button } from '@shared/ui/Button';

import { styles } from './LearnExitButton.styles';

interface LearnExitButtonProps {
  onExit: () => void;
}

export function LearnExitButton({ onExit }: LearnExitButtonProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onExit} className={styles.button}>
      <X className={styles.icon} />
      종료
    </Button>
  );
}

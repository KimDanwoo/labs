import { X } from 'lucide-react';

import { Button } from '@shared/ui/Button';

interface LearnExitButtonProps {
  onExit: () => void;
}

export function LearnExitButton({ onExit }: LearnExitButtonProps) {
  return (
    <Button variant="ghost" size="sm" onClick={onExit} className="gap-1 text-muted-foreground h-7 px-2">
      <X className="h-3.5 w-3.5" />
      종료
    </Button>
  );
}

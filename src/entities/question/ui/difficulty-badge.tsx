import { Badge } from '@/shared/ui/badge';

const difficultyConfig = {
  easy: { label: '쉬움', className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
  medium: { label: '보통', className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' },
  hard: { label: '어려움', className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
};

interface DifficultyBadgeProps {
  difficulty: 'easy' | 'medium' | 'hard';
}

export function DifficultyBadge({ difficulty }: DifficultyBadgeProps) {
  const config = difficultyConfig[difficulty];
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}

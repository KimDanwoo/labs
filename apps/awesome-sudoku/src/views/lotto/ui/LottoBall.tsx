import type { ComponentProps } from 'react';

import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import {
  BALL_BASE_CLASS,
  BALL_EMPHASIS_CLASS,
  BALL_SIZE_CLASS,
  BALL_TONE_CLASS,
  type BallEmphasis,
  type BallSize,
} from '@views/lotto/config/style';
import { ballToneOf } from '@views/lotto/lib/simulationView';

interface LottoBallProps extends ComponentProps<'span'> {
  number: number;
  size: BallSize;
  emphasis?: BallEmphasis;
}

export function LottoBall({ number, size, emphasis = 'plain', className, ...props }: LottoBallProps) {
  const isMatched = emphasis === 'matched';

  return (
    <span
      {...props}
      className={cn(
        BALL_BASE_CLASS,
        BALL_TONE_CLASS[ballToneOf(number)],
        BALL_SIZE_CLASS[size],
        BALL_EMPHASIS_CLASS[emphasis],
        className,
      )}
    >
      {number}
      {isMatched && <span className="sr-only">{LOTTO_COPY.matchedBall}</span>}
    </span>
  );
}

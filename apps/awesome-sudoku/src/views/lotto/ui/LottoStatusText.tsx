import { useState } from 'react';

import { cn } from '@shared/lib/cn';
import { LOTTO_COPY } from '@views/lotto/config/copy';
import { DRAWING_TEXT_CLASS, VERDICT_REVEAL_CLASS } from '@views/lotto/config/style';
import { verdictRevealStyle } from '@views/lotto/lib/simulationView';
import { statusOf } from '@views/lotto/lib/status';
import { useLottoContext } from '@views/lotto/model/hooks/useLottoContext';

export function LottoStatusText() {
  const { ticket, singleDraw, simulation } = useLottoContext();
  const [requestAtDraw] = useState(simulation.request);
  const status = statusOf({ ticket, singleDraw, run: simulation, isRunNewer: simulation.request !== requestAtDraw });
  const isVerdict = status.kind === 'drawn';

  return (
    <>
      <span aria-hidden="true" className="inline-grid">
        {isVerdict && (
          <span className={DRAWING_TEXT_CLASS} style={verdictRevealStyle}>
            {LOTTO_COPY.drawing}
          </span>
        )}
        <span
          key={status.kind}
          className={cn('[grid-area:1/1]', isVerdict && VERDICT_REVEAL_CLASS)}
          style={isVerdict ? verdictRevealStyle : undefined}
        >
          {status.text}
        </span>
      </span>
      <span className="sr-only">{status.announcement}</span>
    </>
  );
}

import type { ReactElement } from 'react';

import { ORIGIN_URL } from '@views/drive/config/menu';

export function OriginalCredits(): ReactElement {
  return (
    <p className="text original-credits">
      원본: Bruno Simon ·{' '}
      <a href={ORIGIN_URL} target="_blank" rel="noopener noreferrer">
        folio-2025
      </a>{' '}
      (MIT) 포크
    </p>
  );
}

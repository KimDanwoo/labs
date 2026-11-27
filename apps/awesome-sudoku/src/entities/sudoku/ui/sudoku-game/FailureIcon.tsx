import { LuX } from 'react-icons/lu';

import { IconCircle } from '@shared/ui/icon-circle';

export function FailureIcon() {
  return (
    <IconCircle size="xl" tone="weak" className="mx-auto text-error-text">
      <LuX strokeWidth={2.5} />
    </IconCircle>
  );
}

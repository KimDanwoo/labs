import { LuCheck } from 'react-icons/lu';

import { IconCircle } from '@shared/ui/icon-circle';

export function SuccessIcon() {
  return (
    <IconCircle size="xl" tone="lemon" className="mx-auto">
      <LuCheck strokeWidth={2.5} />
    </IconCircle>
  );
}

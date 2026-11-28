import { LuTrophy } from 'react-icons/lu';

import { Card } from '@shared/ui/card';
import { RECORD_COPY } from '@views/gostop/config/copy';
import { RecordStats } from '@views/gostop/ui/RecordStats';

export function GostopRecord() {
  return (
    <Card className="grid gap-3">
      <p className="flex items-center gap-2 text-[15px] font-bold text-text-primary [&_svg]:size-4 [&_svg]:text-text-tertiary">
        <LuTrophy aria-hidden="true" />
        {RECORD_COPY.title}
      </p>
      <RecordStats />
    </Card>
  );
}

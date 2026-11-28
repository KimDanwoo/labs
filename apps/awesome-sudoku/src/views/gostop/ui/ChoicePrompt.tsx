import { LuPointer } from 'react-icons/lu';

import { cn } from '@shared/lib/cn';
import { CHOICE_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';

export function ChoicePrompt() {
  const { choice } = useGostopContext();
  if (!choice) return null;

  return (
    <p
      className={cn(
        'pointer-events-none absolute top-0 left-1/2 z-30 inline-flex h-7 -translate-x-1/2 -translate-y-1/2 items-center gap-1.5 rounded-full bg-lemon px-3 text-[13px] font-bold whitespace-nowrap text-ink shadow-[0_0_0_2px_rgb(var(--rgb-ink)),0_6px_14px_rgb(0_0_0/0.45)] [&_svg]:size-3.5',
        styles.prompt,
      )}
    >
      <LuPointer aria-hidden="true" />
      {CHOICE_COPY.prompt}
    </p>
  );
}

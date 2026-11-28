import { cn } from '@shared/lib/cn';
import { CUT_IN_COPY } from '@views/gostop/config/copy';
import { CUT_IN_TAG, CUT_IN_TEXT, CUT_IN_TONE } from '@views/gostop/config/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import motion from '@views/gostop/styles/hwatuMotion.module.css';

export function GostopCutIn() {
  const { cutIn } = useGostopContext();
  if (!cutIn) return null;

  return (
    <div
      key={cutIn.id}
      aria-hidden="true"
      data-tone={cutIn.tone}
      data-power={cutIn.power}
      className={cn(
        'pointer-events-none absolute inset-0 z-40 grid place-items-center overflow-hidden rounded-[26px] lg:rounded-[30px]',
        motion.cutIn,
      )}
    >
      <span className={motion.cutInBurst} />
      <div className={cn('w-[124%] py-2.5 text-center lg:py-3.5', CUT_IN_TONE[cutIn.tone], motion.cutInBand)}>
        <span className={cn(CUT_IN_TAG[cutIn.tone], motion.cutInTag)}>{CUT_IN_COPY.who[cutIn.tone]}</span>
        <p
          className={cn(
            'text-[42px] leading-tight font-black tracking-[-0.05em] lg:text-[60px]',
            CUT_IN_TEXT[cutIn.tone],
            motion.cutInText,
          )}
        >
          {cutIn.label}
        </p>
      </div>
    </div>
  );
}

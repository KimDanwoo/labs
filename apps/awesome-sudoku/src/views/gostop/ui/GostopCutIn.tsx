import { cn } from '@shared/lib/cn';
import { CUT_IN_TONE } from '@views/gostop/config/table';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import motion from '@views/gostop/styles/hwatuMotion.module.css';

export function GostopCutIn() {
  const { cutIn } = useGostopContext();
  if (!cutIn) return null;

  return (
    <div
      key={cutIn.id}
      aria-hidden="true"
      className={cn(
        'pointer-events-none absolute inset-0 z-40 grid place-items-center overflow-hidden rounded-[26px] lg:rounded-[30px]',
        motion.cutIn,
      )}
    >
      <div className={cn('w-[124%] py-2 text-center lg:py-3', CUT_IN_TONE[cutIn.tone], motion.cutInBand)}>
        <p className={cn('text-[42px] leading-tight font-black tracking-[-0.05em] lg:text-[60px]', motion.cutInText)}>
          {cutIn.label}
        </p>
      </div>
    </div>
  );
}

import { CHOICE_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function ChoiceTag() {
  const { choice } = useGostopContext();
  if (!choice) return null;

  return (
    <span className="pointer-events-none absolute -top-5 left-1/2 z-20 inline-flex h-5 -translate-x-1/2 items-center rounded-full bg-white px-2 text-[12px] leading-none font-bold whitespace-nowrap text-ink shadow-[0_2px_8px_rgb(0_0_0/0.45)]">
      {CHOICE_COPY.source[choice.source]}
    </span>
  );
}

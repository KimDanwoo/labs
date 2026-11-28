import type { MouseEvent } from 'react';

import { cn } from '@shared/lib/cn';
import { choiceKindLabel, choicePickLabel } from '@views/gostop/lib/choice';
import { isKeyboardClick, moveChoiceFocus } from '@views/gostop/lib/focus';
import { useFocusOnMount } from '@views/gostop/model/hooks/useFocusOnMount';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import styles from '@views/gostop/styles/table.module.css';

interface ChoicePickProps {
  id: number;
}

export function ChoicePick({ id }: ChoicePickProps) {
  const { choice, choose, requestHandFocus } = useGostopContext();
  const focusRef = useFocusOnMount<HTMLButtonElement>();
  const isFirst = choice?.options[0] === id;

  const handleChoose = (event: MouseEvent<HTMLButtonElement>) => {
    if (isKeyboardClick(event)) requestHandFocus();
    choose(id);
  };

  return (
    <>
      <button
        ref={isFirst ? focusRef : undefined}
        type="button"
        data-choice-pick
        aria-label={choicePickLabel(id)}
        onClick={handleChoose}
        onKeyDown={moveChoiceFocus}
        className={cn('absolute inset-0 min-h-11 min-w-11', styles.pick)}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-2.5 left-1/2 inline-flex h-5 -translate-x-1/2 items-center rounded-full bg-lemon px-1.5 text-[12px] leading-none font-bold whitespace-nowrap text-ink shadow-[0_2px_6px_rgb(0_0_0/0.45)]"
      >
        {choiceKindLabel(id)}
      </span>
    </>
  );
}

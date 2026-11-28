import { SHEET_COPY } from '@views/gostop/config/copy';
import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';

export function CapturedOpener() {
  const { openCaptured } = useGostopContext();

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={SHEET_COPY.openCaptured}
      onClick={openCaptured}
      className="absolute inset-0 z-10 cursor-zoom-in rounded-[18px] transition-colors duration-150 hover:bg-white/4 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-lemon"
    />
  );
}

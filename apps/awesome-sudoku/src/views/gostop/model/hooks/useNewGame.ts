import { useGostopContext } from '@views/gostop/model/hooks/useGostopContext';
import { useCallback } from 'react';

export function useNewGame(): () => void {
  const { reset, deal } = useGostopContext();

  return useCallback(() => {
    reset();
    deal();
  }, [reset, deal]);
}

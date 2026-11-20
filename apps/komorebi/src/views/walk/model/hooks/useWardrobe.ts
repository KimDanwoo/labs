import type { Appearance } from '@views/walk/model/world/appearance';
import { useState } from 'react';

export function useWardrobe(isOpen: boolean, onChange: (next: Appearance) => Promise<boolean>) {
  const [isChanging, setIsChanging] = useState(false);
  const [error, setError] = useState('');
  const [wasOpen, setWasOpen] = useState(isOpen);
  if (wasOpen !== isOpen) {
    setWasOpen(isOpen);
    setError('');
  }

  const choose = async (next: Appearance) => {
    if (isChanging) return;
    setIsChanging(true);
    setError('');
    try {
      if (!(await onChange(next))) setError('옷을 꺼내지 못했어요. 다시 골라 주세요.');
    } finally {
      setIsChanging(false);
    }
  };

  return { isChanging, error, choose };
}

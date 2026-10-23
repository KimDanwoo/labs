import { TOAST_DURATION_MS } from '@features/walk/model/constants';
import { useEffect, useRef, useState } from 'react';

export function useToast() {
  const [message, setMessage] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  function notify(text: string) {
    setMessage(text);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setMessage(''), TOAST_DURATION_MS);
  }
  return { message, notify };
}

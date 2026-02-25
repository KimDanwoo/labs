import { useState, useEffect } from 'react';

/** 값의 변경을 지정된 지연 시간(ms) 동안 디바운스한다. 검색 입력 등에서 불필요한 연산을 줄일 때 사용한다. */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

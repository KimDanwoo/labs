export function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;

  const debouncedFunction = ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
    }, delay);
  }) as T & { cancel: () => void };

  debouncedFunction.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
  };

  return debouncedFunction;
}

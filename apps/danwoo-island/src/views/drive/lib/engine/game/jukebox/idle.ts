interface IdleSchedule {
  readonly delayMs: number;
  readonly timeoutMs: number;
}

export function prefersDataSaving(): boolean {
  const connection: unknown = Reflect.get(navigator, 'connection');
  return typeof connection === 'object' && connection !== null && Reflect.get(connection, 'saveData') === true;
}

export function runWhenIdle(task: () => void, { delayMs, timeoutMs }: IdleSchedule): void {
  setTimeout(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: timeoutMs });
    else task();
  }, delayMs);
}

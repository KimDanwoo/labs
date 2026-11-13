type WorldEngine = typeof import('./engine/world.js');

let enginePromise: Promise<WorldEngine> | null = null;

function loadEngine(): Promise<WorldEngine> {
  enginePromise ??= import('./engine/world.js').catch((error: unknown) => {
    enginePromise = null;
    throw error;
  });
  return enginePromise;
}

export async function bootWorld(isMounted: () => boolean): Promise<void> {
  const engine = await loadEngine();
  if (!isMounted()) return;
  if (engine.isWorldDetached()) {
    window.location.reload();
    return;
  }
  engine.startWorld();
}

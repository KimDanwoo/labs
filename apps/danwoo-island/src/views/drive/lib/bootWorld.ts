type WorldEngine = typeof import('@views/drive/lib/engine/world');

let enginePromise: Promise<WorldEngine> | null = null;

function loadEngine(): Promise<WorldEngine> {
  enginePromise ??= import('@views/drive/lib/engine/world').catch((error: unknown) => {
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

export const STARTUP = { assets: 'assets', graphics: 'graphics', ready: 'ready', error: 'error' } as const;

type StartupStage = (typeof STARTUP)[keyof typeof STARTUP];

const SLOW_STARTUP_MS = 12_000;
const MESSAGE_BY_STAGE = {
  assets: '풍경을 불러오고 있어요',
  graphics: '섬을 준비하고 있어요',
  ready: '',
  error: '준비를 마치지 못했어요',
} satisfies Record<StartupStage, string>;

const status = document.createElement('div');
status.className = 'island-startup';
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
const label = document.createElement('span');
const retry = document.createElement('button');
retry.type = 'button';
retry.textContent = '다시 불러오기';
retry.hidden = true;
retry.addEventListener('click', () => location.reload());
status.append(label, retry);
document.body.append(status);

let stage: StartupStage = STARTUP.assets;

const isSettled = (value: StartupStage): boolean => value === STARTUP.ready || value === STARTUP.error;

const slowTimer = setTimeout(() => {
  if (isSettled(stage)) return;
  label.textContent = '준비가 조금 오래 걸리고 있어요';
  retry.hidden = false;
}, SLOW_STARTUP_MS);

export function setStartupStage(next: StartupStage): void {
  stage = next;
  document.documentElement.dataset.startup = next;
  performance.mark(`danwoo-island:${next}`);
  label.textContent = MESSAGE_BY_STAGE[next];
  status.hidden = next === STARTUP.ready;
  retry.hidden = next !== STARTUP.error;
  if (isSettled(next)) clearTimeout(slowTimer);
  if (next === STARTUP.error) {
    window.dispatchEvent(new CustomEvent('danwoo-island:error', { detail: { code: 'STARTUP_FAILED' } }));
  }
}

setStartupStage(STARTUP.assets);

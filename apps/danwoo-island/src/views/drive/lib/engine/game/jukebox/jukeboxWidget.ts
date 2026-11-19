import type { SoundCloudGlobal, SoundCloudWidget, WidgetEvent, WidgetFrame, WidgetPayload } from './soundcloudWidget';

const READY_TIMEOUT_MS = 12_000;

interface JukeboxWidgetHandlers {
  onPlay: (soundId: number | undefined) => void;
  onPause: (soundId: number | undefined) => void;
  onFinish: (soundId: number | undefined) => void;
  onProgress: (soundId: number | undefined, relativePosition: number | undefined) => void;
  onError: () => void;
  onReady: (widget: SoundCloudWidget) => void;
}

export function bindJukeboxWidget(
  api: SoundCloudGlobal,
  frame: WidgetFrame,
  { onPlay, onPause, onFinish, onProgress, onError, onReady }: JukeboxWidgetHandlers,
): Promise<void> {
  const widget = api.Widget(frame);
  const bind = (name: WidgetEvent, handler: (payload: WidgetPayload) => void): void => {
    const event = api.Widget.Events[name];
    if (event) widget.bind(event, (payload) => handler(payload ?? {}));
  };
  bind('PLAY', ({ soundId }) => onPlay(soundId));
  bind('PAUSE', ({ soundId }) => onPause(soundId));
  bind('FINISH', ({ soundId }) => onFinish(soundId));
  bind('PLAY_PROGRESS', ({ soundId, relativePosition }) => onProgress(soundId, relativePosition));
  bind('ERROR', () => onError());
  return new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      frame.remove();
      reject(new Error('SoundCloud widget was not ready in time'));
    }, READY_TIMEOUT_MS);
    bind('READY', () => {
      clearTimeout(timer);
      onReady(widget);
      resolve();
    });
  });
}

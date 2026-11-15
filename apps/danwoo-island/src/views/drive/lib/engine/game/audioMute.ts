import { Howler } from 'howler';

const STORAGE_KEY = 'soundToggle';
const MUTED_VALUE = '1';
const UNMUTED_VALUE = '0';
const MUTED_CLASS = 'is-audio-muted';

export class AudioMute {
  active = false;
  readonly #onChange: (isMuted: boolean) => void;

  constructor(onChange: (isMuted: boolean) => void) {
    this.#onChange = onChange;
    if (localStorage.getItem(STORAGE_KEY) === MUTED_VALUE) this.activate();
  }

  toggle(): void {
    if (this.active) this.deactivate();
    else this.activate();
  }

  activate(): void {
    if (this.active) return;
    this.#apply(true);
  }

  deactivate(): void {
    if (!this.active) return;
    this.#apply(false);
  }

  #apply(isMuted: boolean): void {
    Howler.mute(isMuted);
    this.active = isMuted;
    localStorage.setItem(STORAGE_KEY, isMuted ? MUTED_VALUE : UNMUTED_VALUE);
    document.documentElement.classList.toggle(MUTED_CLASS, isMuted);
    this.#onChange(isMuted);
  }
}

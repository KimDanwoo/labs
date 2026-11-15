import type { JukeboxTrack } from '../../data/worldContent';
import { createElement } from '../utilities/createElement';
import { requireElement } from '../utilities/requireElement';
import type { JukeboxPlayer, JukeboxState, JukeboxStatus } from './jukeboxPlayer';

const STATUS_TEXT = {
  idle: '듣고 싶은 곡을 골라 주세요',
  loading: '쥬크박스를 깨우는 중이에요',
  ready: '재생을 눌러 주세요',
  starting: '곧 흘러나와요',
  playing: '지금 흐르는 곡',
  paused: '잠시 멈췄어요. 재생을 눌러 주세요',
  error: '재생하지 못했어요. SoundCloud에서 들어 주세요',
} satisfies Record<JukeboxStatus, string>;

const MILLISECONDS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const ACTIVE_CLASS = 'is-active';
const PLAYING_CLASS = 'is-playing';

function formatDuration(milliseconds: number): string {
  const totalSeconds = Math.round(milliseconds / MILLISECONDS_PER_SECOND);
  const seconds = String(totalSeconds % SECONDS_PER_MINUTE).padStart(2, '0');
  return `${Math.floor(totalSeconds / SECONDS_PER_MINUTE)}:${seconds}`;
}

function iconButton(className: string, label: string): HTMLButtonElement {
  const button = createElement('button', `jukebox-button ${className}`, [createElement('span', 'jukebox-icon')]);
  button.type = 'button';
  button.setAttribute('aria-label', label);
  return button;
}

function trackItem(track: JukeboxTrack, index: number): HTMLLIElement {
  const cover = createElement('img', 'jukebox-track-cover');
  cover.src = track.artwork;
  cover.alt = '';
  cover.loading = 'lazy';
  const button = createElement('button', 'jukebox-track', [
    cover,
    createElement('span', 'jukebox-track-title', [track.title]),
    createElement('span', 'jukebox-track-duration', [formatDuration(track.durationMs)]),
  ]);
  button.type = 'button';
  button.dataset.index = String(index);
  return createElement('li', '', [button]);
}

export class JukeboxPanel {
  readonly #player: JukeboxPlayer;
  readonly #root: HTMLElement;
  readonly #cover = createElement('img', 'jukebox-cover');
  readonly #status = createElement('span', 'jukebox-status');
  readonly #title = createElement('strong', 'jukebox-title');
  readonly #progress = createElement('span', 'jukebox-progress-bar');
  readonly #toggle = iconButton('is-toggle', '재생');
  readonly #source = createElement('a', 'jukebox-source', ['SoundCloud에서 듣기']);
  readonly #items: HTMLLIElement[];
  #renderedIndex: number | null | undefined;

  constructor({ element, player }: { element: HTMLElement; player: JukeboxPlayer }) {
    this.#player = player;
    this.#root = element;
    this.#cover.alt = '';
    this.#source.target = '_blank';
    this.#source.rel = 'noopener noreferrer';
    this.#items = player.tracks.map(trackItem);
    this.#mountNowPlaying(requireElement(element, '.js-jukebox-now', HTMLElement));
    this.#mountTracks(requireElement(element, '.js-jukebox-tracks', HTMLElement));
    player.events.on('change', (state) => this.#render(state));
    this.#render(player.state);
  }

  #mountNowPlaying(container: HTMLElement): void {
    const previous = iconButton('is-previous', '이전 곡');
    const next = iconButton('is-next', '다음 곡');
    const stop = createElement('button', 'jukebox-stop', ['섬 배경음으로']);
    stop.type = 'button';
    previous.addEventListener('click', () => this.#player.previous());
    this.#toggle.addEventListener('click', () => this.#player.toggle());
    next.addEventListener('click', () => this.#player.next());
    stop.addEventListener('click', () => this.#player.stop());
    container.replaceChildren(
      createElement('div', 'jukebox-disc', [this.#cover]),
      createElement('div', 'jukebox-meta', [
        this.#status,
        this.#title,
        createElement('span', 'jukebox-progress', [this.#progress]),
        createElement('div', 'jukebox-controls', [previous, this.#toggle, next, stop]),
        this.#source,
      ]),
    );
  }

  #mountTracks(list: HTMLElement): void {
    list.replaceChildren(...this.#items);
    list.addEventListener('click', (event) => {
      if (!(event.target instanceof Element)) return;
      const index = Number(event.target.closest<HTMLElement>('.jukebox-track')?.dataset.index);
      if (Number.isInteger(index)) this.#player.select(index);
    });
  }

  #render({ status, trackIndex, progress }: JukeboxState): void {
    const track = trackIndex === null ? null : this.#player.tracks[trackIndex];
    const isPlaying = status === 'playing';
    this.#root.classList.toggle(PLAYING_CLASS, isPlaying);
    this.#status.textContent = STATUS_TEXT[status];
    this.#title.textContent = track?.title ?? `직접 만든 노래 ${this.#player.tracks.length}곡`;
    this.#progress.style.transform = `scaleX(${progress})`;
    this.#toggle.setAttribute('aria-label', isPlaying ? '일시정지' : '재생');
    this.#toggle.classList.toggle(PLAYING_CLASS, isPlaying);
    this.#source.hidden = !track;
    this.#cover.hidden = !track;
    if (trackIndex === this.#renderedIndex) return;
    this.#renderedIndex = trackIndex;
    if (track) {
      this.#cover.src = track.artwork;
      this.#source.href = track.url;
    }
    for (const [index, item] of this.#items.entries()) {
      const isActive = index === trackIndex;
      item.classList.toggle(ACTIVE_CLASS, isActive);
      item.firstElementChild?.setAttribute('aria-current', String(isActive));
    }
  }
}

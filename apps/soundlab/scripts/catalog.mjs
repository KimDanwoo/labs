const API_ORIGIN = 'https://api-v2.soundcloud.com';
const MAX_PAGES = 100;

function safeUrl(value, hosts) {
  if (typeof value !== 'string') throw new Error('URL이 문자열이 아닙니다');
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('허용하지 않은 음원 URL입니다');
  if (!hosts.includes(url.hostname)) throw new Error('허용하지 않은 음원 URL입니다');
  if (url.username) throw new Error('허용하지 않은 음원 URL입니다');
  if (url.password) throw new Error('허용하지 않은 음원 URL입니다');
  return url.toString();
}

function readRawId(raw) {
  if (!raw) throw new Error('유효하지 않은 곡 ID입니다');
  if (typeof raw !== 'object') throw new Error('유효하지 않은 곡 ID입니다');
  if (!Number.isSafeInteger(raw.id)) throw new Error('유효하지 않은 곡 ID입니다');
  if (raw.id <= 0) throw new Error('유효하지 않은 곡 ID입니다');
  return raw.id;
}

function readTitle(raw) {
  const isValid =
    typeof raw.title === 'string' && raw.title.trim() && Number.isFinite(raw.duration) && raw.duration > 0;
  if (!isValid) throw new Error(`곡 ${raw.id}의 제목 또는 길이가 잘못됐습니다`);
  return raw.title.normalize('NFC');
}

function readArtwork(raw) {
  const artwork = safeUrl(raw.artwork_url, ['i1.sndcdn.com']).match(/^(.*)-[a-z0-9]+(\.jpg|\.png)$/);
  if (!artwork) throw new Error(`곡 ${raw.id}의 아트워크 형식이 잘못됐습니다`);
  return { artworkBase: artwork[1], artworkExt: artwork[2] };
}

function readGenre(raw) {
  const hasGenre = typeof raw.genre === 'string' && raw.genre;
  return hasGenre ? raw.genre.normalize('NFC') : 'Unclassified';
}

function readDescription(raw) {
  return typeof raw.description === 'string' ? raw.description.normalize('NFC').trim() : '';
}

export function toTrack(raw) {
  readRawId(raw);
  const title = readTitle(raw);
  const { artworkBase, artworkExt } = readArtwork(raw);
  return {
    id: raw.id,
    title,
    permalinkUrl: safeUrl(raw.permalink_url, ['soundcloud.com']),
    artworkBase,
    artworkExt,
    waveformUrl: safeUrl(raw.waveform_url, ['wave.sndcdn.com']),
    durationMs: raw.duration,
    genre: readGenre(raw),
    description: readDescription(raw),
    isAvailable: true,
  };
}

function assertPageUrl(next, seen) {
  const url = new URL(next);
  if (url.origin !== API_ORIGIN) throw new Error('곡 목록의 페이지 연결이 잘못됐습니다');
  if (url.username) throw new Error('곡 목록의 페이지 연결이 잘못됐습니다');
  if (url.password) throw new Error('곡 목록의 페이지 연결이 잘못됐습니다');
  if (seen.has(next)) throw new Error('곡 목록의 페이지 연결이 잘못됐습니다');
  if (seen.size >= MAX_PAGES) throw new Error('곡 목록의 페이지 연결이 잘못됐습니다');
}

function readNextHref(page) {
  const isInvalidNextHref = page.next_href != null && typeof page.next_href !== 'string';
  if (isInvalidNextHref) throw new Error('다음 페이지 URL이 잘못됐습니다');
  return page.next_href || null;
}

export async function fetchCatalog({ firstUrl, getJson }) {
  const seen = new Set();
  const tracks = new Map();
  let next = firstUrl;
  while (next) {
    assertPageUrl(next, seen);
    seen.add(next);
    const page = await getJson(next);
    if (!page) throw new Error('곡 목록 응답이 잘못됐습니다');
    if (!Array.isArray(page.collection)) throw new Error('곡 목록 응답이 잘못됐습니다');
    for (const raw of page.collection) {
      const track = toTrack(raw);
      tracks.set(track.id, track);
    }
    next = readNextHref(page);
  }
  if (tracks.size === 0) throw new Error('빈 목록으로 기존 아카이브를 덮어쓸 수 없습니다');
  return [...tracks.values()];
}

export function mergeCatalog(current, previous) {
  const ids = new Set(current.map((track) => track.id));
  return [
    ...current,
    ...previous.filter((track) => !ids.has(track.id)).map((track) => ({ ...track, isAvailable: false })),
  ];
}

function quote(value) {
  if (value.split("'").length > value.split('"').length) return JSON.stringify(value);
  return `'${JSON.stringify(value).slice(1, -1).replace(/\\"/g, '"').replace(/'/g, "\\'")}'`;
}

export function renderCatalog(tracks) {
  const body = tracks
    .map(
      (track) =>
        `  {\n${Object.entries(track)
          .map(([key, value]) => {
            const literal = typeof value === 'string' ? quote(value) : JSON.stringify(value);
            const line = `    ${key}: ${literal},`;
            return line.length > 120 ? `    ${key}:\n      ${literal},` : line;
          })
          .join('\n')}\n  },`,
    )
    .join('\n');
  return `import type { Track } from '@entities/track/model/types/track';\n\nexport const TRACKS: readonly Track[] = [\n${body}\n];\n`;
}

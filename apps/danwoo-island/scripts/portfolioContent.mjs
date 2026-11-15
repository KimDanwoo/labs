import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROFILE_PARAGRAPHS } from '../../hub/src/views/home/model/constants/profileContent.ts';
import { PROJECTS } from '../../hub/src/views/home/model/constants/projects.ts';
import { TRACKS } from '../../soundlab/src/entities/track/model/constants/tracks.ts';

const HUB_ROOT = fileURLToPath(new URL('../../hub/', import.meta.url));
const FONT_ROOT = fileURLToPath(new URL('../../../packages/tokens/fonts/', import.meta.url));
const LAB_URL = 'https://lab.danwoo.dev/';
const FONT_SUBSETS = ['latin', 'ko-common', 'symbols'];
const PROJECT_IMAGE_PATH = /^\/projects\/[a-z0-9-]+\.webp$/;
const SOUNDCLOUD_HOST = 'soundcloud.com';
const ARTWORK_HOST = 'i1.sndcdn.com';
const ARTWORK_SIZE = 't200x200';
const ARTWORK_EXTENSIONS = new Set(['.jpg', '.png']);

function validateUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('포트폴리오 링크는 HTTPS여야 합니다.');
  return url.href;
}

function requireHost(value, host) {
  const url = new URL(validateUrl(value));
  if (url.hostname !== host) throw new Error(`${host}가 아닌 주소입니다: ${value}`);
  return url.href;
}

function toJukeboxTrack(track) {
  if (!Number.isSafeInteger(track.id) || track.id <= 0) throw new Error(`잘못된 곡 ID입니다: ${track.id}`);
  if (!(track.durationMs > 0)) throw new Error(`곡 길이가 없습니다: ${track.title}`);
  if (!ARTWORK_EXTENSIONS.has(track.artworkExt)) throw new Error(`잘못된 아트워크 확장자입니다: ${track.title}`);
  return {
    id: track.id,
    title: track.title,
    url: requireHost(track.permalinkUrl, SOUNDCLOUD_HOST),
    artwork: requireHost(`${track.artworkBase}-${ARTWORK_SIZE}${track.artworkExt}`, ARTWORK_HOST),
    durationMs: track.durationMs,
  };
}

function buildTracks() {
  const tracks = TRACKS.filter((track) => track.isAvailable !== false).map(toJukeboxTrack);
  if (new Set(tracks.map(({ id }) => id)).size !== tracks.length) throw new Error('곡 ID가 중복됩니다.');
  if (tracks.length === 0) throw new Error('쥬크박스에 넣을 곡이 없습니다.');
  return tracks;
}

function collectAssets() {
  const projectImages = PROJECTS.map((project) => {
    if (!PROJECT_IMAGE_PATH.test(project.image)) throw new Error('잘못된 프로젝트 이미지 경로입니다.');
    return {
      source: path.join(HUB_ROOT, 'public', project.image),
      destination: `danwoo/${path.basename(project.image)}`,
    };
  });
  const fonts = ['Regular', 'Bold'].flatMap((weight) =>
    FONT_SUBSETS.map((subset) => ({
      source: path.join(FONT_ROOT, `MaruBuri-${weight}.${subset}.woff2`),
      destination: `danwoo/fonts/MaruBuri-${weight}.${subset}.woff2`,
    })),
  );
  return [
    ...projectImages,
    ...fonts,
    { source: path.join(FONT_ROOT, 'LICENSE.md'), destination: 'danwoo/fonts/LICENSE.md' },
  ];
}

function buildContent() {
  const links = PROFILE_PARAGRAPHS.flat().filter((part) => typeof part === 'object');
  const resume = links.find((part) => part.label === '이력서');
  if (!resume) throw new Error('허브의 이력서 링크가 없습니다.');
  return {
    labUrl: validateUrl(LAB_URL),
    resumeUrl: validateUrl(resume.href),
    projects: PROJECTS.map((project) => ({
      title: project.title,
      titleSmall: [project.title],
      url: validateUrl(project.href),
      attributes: { role: 'Creator' },
      distinctions: [],
      images: [path.basename(project.image)],
    })),
    lab: [{ title: 'Danwoo Lab', url: LAB_URL, image: 'lab.webp', imageMini: 'lab.webp' }],
    social: links
      .map((part) => ({ name: part.label, url: validateUrl(part.href), align: 'right' }))
      .concat([{ name: 'Danwoo Lab', url: LAB_URL, align: 'left' }]),
    tracks: buildTracks(),
  };
}

export function preparePortfolioContent() {
  const source = `import type { WorldContent } from './worldContent';\n\nexport default ${JSON.stringify(buildContent(), null, 2)} satisfies WorldContent;\n`;
  const assets = collectAssets();
  const fingerprint = createHash('sha256').update(source);
  for (const asset of assets) fingerprint.update(asset.destination).update(readFileSync(asset.source));
  return { source, assets, hash: fingerprint.digest('hex') };
}

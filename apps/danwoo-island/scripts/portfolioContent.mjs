import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PROFILE_PARAGRAPHS } from '../../hub/src/views/home/model/constants/profileContent.ts';
import { PROJECTS } from '../../hub/src/views/home/model/constants/projects.ts';

const HUB_ROOT = fileURLToPath(new URL('../../hub/', import.meta.url));
const FONT_ROOT = fileURLToPath(new URL('../../../packages/tokens/fonts/', import.meta.url));
const LANDING_PREVIEW = fileURLToPath(new URL('../upstream/assets/landing-preview.webp', import.meta.url));
const LAB_URL = 'https://lab.danwoo.dev/';
const PROJECT_IMAGE_PATH = /^\/projects\/[a-z0-9-]+\.webp$/;

function validateUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password) throw new Error('포트폴리오 링크는 HTTPS여야 합니다.');
  return url.href;
}

function collectAssets() {
  const projectImages = PROJECTS.map((project) => {
    if (!PROJECT_IMAGE_PATH.test(project.image)) throw new Error('잘못된 프로젝트 이미지 경로입니다.');
    return {
      source: path.join(HUB_ROOT, 'public', project.image),
      destination: `danwoo/${path.basename(project.image)}`,
    };
  });
  const fonts = ['Regular', 'Bold'].map((weight) => ({
    source: path.join(FONT_ROOT, `source/MaruBuri-${weight}.woff2`),
    destination: `danwoo/fonts/MaruBuri-${weight}.woff2`,
  }));
  return [
    ...projectImages,
    { source: path.join(HUB_ROOT, 'app/opengraph-image.png'), destination: 'danwoo/hub.png' },
    { source: LANDING_PREVIEW, destination: 'danwoo/landing-preview.webp' },
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
    lab: [{ title: 'Danwoo Lab', url: LAB_URL, image: 'hub.png', imageMini: 'hub.png' }],
    social: links
      .map((part) => ({ name: part.label, url: validateUrl(part.href), align: 'right' }))
      .concat([{ name: 'Danwoo Lab', url: LAB_URL, align: 'left' }]),
  };
}

export function preparePortfolioContent() {
  const source = `// Generated from Danwoo Lab hub content by scripts/syncWorld.mjs. Edit the hub, then sync.\nexport default ${JSON.stringify(buildContent(), null, 2)}\n`;
  const assets = collectAssets();
  const fingerprint = createHash('sha256').update(source);
  for (const asset of assets) fingerprint.update(asset.destination).update(readFileSync(asset.source));
  return { source, assets, hash: fingerprint.digest('hex') };
}

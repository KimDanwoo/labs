import { readFile } from 'node:fs/promises';
import satori from 'satori';
import sharp from 'sharp';

export type OgCard = {
  label: string;
  color: string;
  title: string;
  subtitle?: string;
};

const WIDTH = 1200;
const HEIGHT = 630;
const PADDING_X = 80;
// satori는 woff2를 읽지 못해 woff로 변환한 서체를 쓰고, 스타일시트의 CSS 변수를 볼 수 없어 토큰 값을 hex로 옮겨 둔다
const FONT_PATH = 'src/assets/fonts/MaruBuri-Bold.woff';
const COLOR = {
  background: '#ffffff',
  foreground: '#070a12',
  muted: '#44484e',
  border: '#e2e5e9',
} as const;

/** 카테고리 색(--color-info/warning/success)과 블루 포인트(--color-primary)의 라이트 테마 값 */
export const OG_ACCENT = {
  dev: '#007ead',
  retro: '#b3621e',
  reading: '#008c45',
  book: '#0064ad',
} as const;

// 빌드는 앱 폴더에서 돌므로 앱 기준 상대 경로로 읽는다. 여러 이미지가 한 번 읽은 서체를 같이 쓴다
let font: Promise<Buffer> | undefined;
const loadFont = () => (font ??= readFile(FONT_PATH));

type Node = {
  type: string;
  props: { style: Record<string, string | number>; children?: Node[] | string; src?: string };
};
const el = (style: Node['props']['style'], children?: Node['props']['children']): Node => ({
  type: 'div',
  props: { style, children },
});
const fill = { position: 'absolute', top: 0, left: 0, width: WIDTH, height: HEIGHT } as const;

function card({ label, color, title, subtitle }: OgCard): Node {
  return el(
    {
      // satori는 기본이 content-box라 패딩이 캔버스 밖으로 밀려나 아래 줄이 잘린다
      boxSizing: 'border-box',
      width: WIDTH,
      height: HEIGHT,
      display: 'flex',
      flexDirection: 'column',
      padding: `72px ${PADDING_X}px 64px`,
      background: COLOR.background,
      borderTop: `14px solid ${color}`,
      fontFamily: 'MaruBuri',
    },
    [
      el({ display: 'flex', alignItems: 'center', gap: 16, fontSize: 30, color }, [
        el({ width: 18, height: 18, borderRadius: 9, background: color }),
        el({ display: 'flex' }, label),
      ]),
      el(
        {
          display: 'block',
          width: WIDTH - PADDING_X * 2,
          marginTop: 40,
          fontSize: 66,
          lineHeight: 1.32,
          letterSpacing: '-0.02em',
          color: COLOR.foreground,
          wordBreak: 'keep-all',
          lineClamp: 3,
        },
        title,
      ),
      ...(subtitle ? [el({ display: 'flex', marginTop: 20, fontSize: 34, color: COLOR.muted }, subtitle)] : []),
      el({ display: 'flex', flexGrow: 1 }),
      el(
        {
          display: 'flex',
          paddingTop: 32,
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `2px solid ${COLOR.border}`,
        },
        [
          el({ display: 'flex', fontSize: 34, color: COLOR.foreground }, 'Dansoon'),
          el({ display: 'flex', fontSize: 28, color: COLOR.muted }, 'log.danwoo.dev'),
        ],
      ),
    ],
  );
}

const COVER_TITLE_WIDTH = 720;
// 제목이 길수록 글자를 줄여 잘리지 않고 끝까지 보이게 한다(가장 긴 제목도 세 줄 안팎)
const coverTitleSize = (title: string) => (title.length <= 28 ? 60 : title.length <= 40 ? 54 : 48);

/**
 * satori는 keep-all이어도 쌍점·쉼표 앞에서 줄을 바꿔 문장부호가 다음 줄 첫머리로 떨어진다.
 * 띄어쓰기 단위로 낱말을 나눠 감싸 낱말 안에서는 줄이 바뀌지 않게 한다.
 */
function coverTitle(title: string): Node {
  const fontSize = coverTitleSize(title);
  return el(
    {
      display: 'flex',
      flexWrap: 'wrap',
      columnGap: Math.round(fontSize * 0.28),
      width: COVER_TITLE_WIDTH,
      marginTop: 36,
      fontSize,
      lineHeight: 1.32,
      letterSpacing: '-0.02em',
      color: COLOR.foreground,
    },
    title.split(' ').map((word) => el({ display: 'flex' }, word)),
  );
}

/** 배경 위 왼쪽에 제목을 얹는다. 배경은 오른쪽에 모티프를 두고 왼쪽을 비워 두도록 만든다(scripts/make-thumbnails.ts). */
function coverCard({ label, color, title }: OgCard, backgroundUri: string): Node {
  return el({ ...fill, display: 'flex', fontFamily: 'MaruBuri' }, [
    { type: 'img', props: { src: backgroundUri, style: { ...fill, objectFit: 'cover' } } },
    // 배경 밝기가 글마다 달라도 제목이 읽히도록 왼쪽부터 옅게 덮는다
    el({ ...fill, backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.72) 50%, rgba(255,255,255,0) 78%)' }),
    el(
      {
        ...fill,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        padding: `72px ${PADDING_X}px 60px`,
      },
      [
        el({ display: 'flex', alignItems: 'center', gap: 14, fontSize: 28, color }, [
          el({ width: 16, height: 16, borderRadius: 8, background: color }),
          el({ display: 'flex' }, label),
        ]),
        coverTitle(title),
        el({ display: 'flex', flexGrow: 1 }),
        el({ display: 'flex', fontSize: 30, color: COLOR.foreground }, 'Dansoon'),
      ],
    ),
  ]);
}

const renderSvg = async (node: Node) =>
  Buffer.from(
    await satori(node as Parameters<typeof satori>[0], {
      width: WIDTH,
      height: HEIGHT,
      fonts: [{ name: 'MaruBuri', data: await loadFont(), weight: 700, style: 'normal' }],
    }),
  );

/** 공유 미리보기용 1200×630 PNG를 만든다. */
export async function renderOgImage(input: OgCard): Promise<Buffer> {
  return sharp(await renderSvg(card(input))).png().toBuffer();
}

const THUMBNAIL_QUALITY = 86;

/** 배경 이미지에 제목을 얹은 1200×630 JPG 썸네일(목록·링크 미리보기용)을 만든다. */
export async function renderThumbnail(input: OgCard, background: Buffer): Promise<Buffer> {
  const resized = await sharp(background).resize(WIDTH, HEIGHT, { fit: 'cover' }).jpeg().toBuffer();
  const svg = await renderSvg(coverCard(input, `data:image/jpeg;base64,${resized.toString('base64')}`));
  return sharp(svg).jpeg({ quality: THUMBNAIL_QUALITY, mozjpeg: true }).toBuffer();
}

export const pngResponse = (png: Buffer) =>
  new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });

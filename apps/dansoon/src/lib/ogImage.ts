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

type Node = { type: string; props: { style: Record<string, string | number>; children?: Node[] | string } };
const el = (style: Node['props']['style'], children?: Node['props']['children']): Node => ({
  type: 'div',
  props: { style, children },
});

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

/** 공유 미리보기용 1200×630 PNG를 만든다. */
export async function renderOgImage(input: OgCard): Promise<Buffer> {
  const svg = await satori(card(input) as Parameters<typeof satori>[0], {
    width: WIDTH,
    height: HEIGHT,
    fonts: [{ name: 'MaruBuri', data: await loadFont(), weight: 700, style: 'normal' }],
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export const pngResponse = (png: Buffer) =>
  new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });

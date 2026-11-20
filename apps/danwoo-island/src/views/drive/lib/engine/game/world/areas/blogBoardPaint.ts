import { Fn, positionGeometry, sin } from 'three/tsl';
import type * as THREE from 'three/webgpu';

import {
  type BoardState,
  CANVAS,
  COLORS,
  FLUTTER,
  FONTS,
  PAGE_TURN,
  ROW,
  fitText,
  formatDate,
  postsOf,
  statusText,
} from '@views/drive/lib/engine/game/world/areas/blogPostCard';

type FloatUniform = THREE.UniformNode<'float', number>;

export function paperPosition(
  { time, flutter, turn }: { time: FloatUniform; flutter: FloatUniform; turn: FloatUniform },
  top: number,
  height: number,
): THREE.Node {
  return Fn(() => {
    const position = positionGeometry.toVar();
    const hang = position.y.negate().add(top);
    const hangRatio = hang.div(height);
    const wave = sin(time.mul(FLUTTER.speed).add(position.x.mul(2.2)).add(position.y.mul(1.4)))
      .mul(sin(time.mul(FLUTTER.speed * 0.43).add(position.x.mul(0.9))))
      .add(1)
      .mul(0.5);
    const lift = wave.mul(flutter).mul(hangRatio.pow(1.6)).mul(FLUTTER.lift);
    const angle = turn.mul(Math.PI / 2).mul(hangRatio.mul(PAGE_TURN.curl).add(1 - PAGE_TURN.curl / 2));
    position.y.assign(hang.mul(angle.cos()).negate().add(top));
    position.z.assign(hang.mul(angle.sin()).add(lift));
    return position;
  })();
}

export function paintBoard(context: CanvasRenderingContext2D, state: BoardState): void {
  const { width, height, padding } = CANVAS;
  context.fillStyle = COLORS.paper;
  context.fillRect(0, 0, width, height);
  context.textBaseline = 'alphabetic';
  context.textAlign = 'left';
  context.fillStyle = COLORS.title;
  context.font = FONTS.heading;
  context.fillText('최신 글', padding, 150);
  context.font = FONTS.label;
  context.fillStyle = COLORS.muted;
  context.textAlign = 'right';
  context.fillText('Dansoon 블로그', width - padding, 150);
  context.textAlign = 'left';
  context.fillStyle = COLORS.rule;
  context.fillRect(padding, 190, width - padding * 2, 6);

  const message = statusText(state);
  if (message) {
    context.font = FONTS.label;
    context.fillStyle = COLORS.muted;
    context.fillText(message, padding, ROW.top + 60);
  } else {
    for (const [index, post] of postsOf(state).entries()) {
      const top = ROW.top + index * ROW.height;
      context.font = FONTS.date;
      context.fillStyle = COLORS.muted;
      context.fillText(formatDate(post.publishedAt), padding, top + ROW.dateOffset + 30);
      context.font = FONTS.post;
      context.fillStyle = COLORS.ink;
      context.fillText(fitText(context, post.title, width - padding * 2), padding, top + ROW.titleOffset + 40);
    }
  }
}

import { canvasTexture } from './art';

type Painter = CanvasRenderingContext2D;

function shape(c: Painter, fill: string, points: number[][]) {
  c.beginPath();
  points.forEach(([x, y]) => c.lineTo(x!, y!));
  c.closePath();
  c.fillStyle = fill;
  c.fill();
}

function line(c: Painter, colour: string, width: number, points: number[][]) {
  c.beginPath();
  points.forEach(([x, y]) => c.lineTo(x!, y!));
  c.strokeStyle = colour;
  c.lineWidth = width;
  c.stroke();
}

function paintHull(c: Painter) {
  shape(c, '#294d58', [
    [62, 191],
    [444, 179],
    [408, 219],
    [111, 225],
    [78, 210],
  ]);
  const hull = c.createLinearGradient(0, 165, 0, 224);
  hull.addColorStop(0, '#fff4d6');
  hull.addColorStop(0.55, '#d6ded2');
  hull.addColorStop(1, '#779eaa');
  c.fillStyle = hull;
  c.beginPath();
  c.moveTo(58, 175);
  c.lineTo(454, 162);
  c.lineTo(419, 200);
  c.quadraticCurveTo(244, 226, 102, 205);
  c.closePath();
  c.fill();
  line(c, '#567b83', 6, [
    [78, 190],
    [248, 199],
    [433, 181],
  ]);
  shape(c, '#8f6650', [
    [89, 170],
    [406, 160],
    [449, 164],
    [251, 185],
    [62, 180],
  ]);
}

function paintCabin(c: Painter, left: number) {
  shape(c, '#d9ded0', [
    [left, 165],
    [left, 116],
    [342, 109],
    [358, 167],
  ]);
  shape(c, '#f5edce', [
    [left, 116],
    [left + 20, 104],
    [329, 100],
    [342, 109],
  ]);
  shape(c, '#94b0ac', [
    [342, 109],
    [363, 121],
    [375, 164],
    [358, 167],
  ]);
  for (let x = left + 12; x < 328; x += 35) {
    shape(c, '#285969', [
      [x, 123],
      [x + 24, 121],
      [x + 26, 147],
      [x, 149],
    ]);
    line(c, '#a2cbd0', 2, [
      [x + 3, 125],
      [x + 20, 124],
    ]);
  }
  shape(c, '#365f6b', [
    [348, 121],
    [358, 127],
    [364, 146],
    [352, 147],
  ]);
}

function paintMast(c: Painter) {
  line(c, '#586f68', 4, [
    [277, 104],
    [275, 42],
    [312, 54],
  ]);
  line(c, '#6b817a', 2, [
    [275, 62],
    [161, 167],
    [276, 85],
    [402, 161],
  ]);
  shape(c, '#bd654d', [
    [279, 45],
    [310, 50],
    [280, 58],
  ]);
}

function paintRailing(c: Painter) {
  line(c, '#f0e9d2', 3, [
    [89, 172],
    [85, 151],
    [211, 148],
  ]);
  for (const x of [97, 136, 177, 211, 387, 416]) {
    line(c, '#dbdec9', 2, [
      [x, 151],
      [x, 172],
    ]);
  }
}

function paintPortholes(c: Painter) {
  for (const x of [133, 199, 354]) {
    c.fillStyle = '#3a5355';
    c.beginPath();
    c.ellipse(x, 195, 8, 12, 0.1, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#8caca6';
    c.beginPath();
    c.ellipse(x, 195, 3, 6, 0.1, 0, Math.PI * 2);
    c.fill();
  }
}

export function boatTexture(isFerry: boolean) {
  return canvasTexture(512, 256, (c) => {
    c.lineJoin = 'round';
    paintHull(c);
    paintCabin(c, isFerry ? 117 : 220);
    paintMast(c);
    paintRailing(c);
    paintPortholes(c);
  });
}

import { canvasTexture } from './art';

export function boatTexture(isFerry: boolean) {
  return canvasTexture(512, 256, (c) => {
    const shape = (fill: string, points: number[][]) => {
      c.beginPath();
      points.forEach(([x, y]) => c.lineTo(x!, y!));
      c.closePath();
      c.fillStyle = fill;
      c.fill();
    };
    const line = (colour: string, width: number, points: number[][]) => {
      c.beginPath();
      points.forEach(([x, y]) => c.lineTo(x!, y!));
      c.strokeStyle = colour;
      c.lineWidth = width;
      c.stroke();
    };
    c.lineJoin = 'round';
    shape('#294d58', [
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
    line('#567b83', 6, [
      [78, 190],
      [248, 199],
      [433, 181],
    ]);
    shape('#8f6650', [
      [89, 170],
      [406, 160],
      [449, 164],
      [251, 185],
      [62, 180],
    ]);
    const left = isFerry ? 117 : 220;
    shape('#d9ded0', [
      [left, 165],
      [left, 116],
      [342, 109],
      [358, 167],
    ]);
    shape('#f5edce', [
      [left, 116],
      [left + 20, 104],
      [329, 100],
      [342, 109],
    ]);
    shape('#94b0ac', [
      [342, 109],
      [363, 121],
      [375, 164],
      [358, 167],
    ]);
    for (let x = left + 12; x < 328; x += 35) {
      shape('#285969', [
        [x, 123],
        [x + 24, 121],
        [x + 26, 147],
        [x, 149],
      ]);
      line('#a2cbd0', 2, [
        [x + 3, 125],
        [x + 20, 124],
      ]);
    }
    shape('#365f6b', [
      [348, 121],
      [358, 127],
      [364, 146],
      [352, 147],
    ]);
    line('#586f68', 4, [
      [277, 104],
      [275, 42],
      [312, 54],
    ]);
    line('#6b817a', 2, [
      [275, 62],
      [161, 167],
      [276, 85],
      [402, 161],
    ]);
    shape('#bd654d', [
      [279, 45],
      [310, 50],
      [280, 58],
    ]);
    line('#f0e9d2', 3, [
      [89, 172],
      [85, 151],
      [211, 148],
    ]);
    for (const x of [97, 136, 177, 211, 387, 416]) {
      line('#dbdec9', 2, [
        [x, 151],
        [x, 172],
      ]);
    }
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
  });
}

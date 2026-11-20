import { canvasTexture } from '@views/walk/lib/art';

export function sparrowTexture(wing: number) {
  return canvasTexture(128, 96, (c) => {
    const ellipse = (x: number, y: number, rx: number, ry: number, colour: string) => {
      c.fillStyle = colour;
      c.beginPath();
      c.ellipse(x, y, rx, ry, -0.2, 0, Math.PI * 2);
      c.fill();
    };
    c.fillStyle = '#635448';
    c.beginPath();
    c.moveTo(39, 61);
    c.lineTo(8, 40);
    c.lineTo(18, 66);
    c.fill();
    ellipse(61, 59, 30, 21, '#ab8d63');
    ellipse(68, 67, 20, 13, '#e5d8b9');
    ellipse(83, 40, 19, 17, '#88664a');
    ellipse(91, 46, 12, 10, '#eadfc8');
    ellipse(89, 50, 5, 5, '#50463e');
    ellipse(60, 55, 22, 12, '#766049');
    c.strokeStyle = '#cfb68b';
    c.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(41 + i * 6, 54);
      c.lineTo(66 + i * 4, 62);
      c.stroke();
    }
    if (wing) {
      c.fillStyle = '#826c52';
      c.beginPath();
      c.moveTo(51, 57);
      c.quadraticCurveTo(24, wing > 0 ? -8 : 89, 5, wing > 0 ? 9 : 91);
      c.quadraticCurveTo(52, wing > 0 ? 20 : 84, 74, 55);
      c.fill();
    }
    ellipse(93, 38, 3, 3, '#252e29');
    ellipse(94, 37, 1, 1, '#fff4d9');
    c.fillStyle = '#6e5943';
    c.beginPath();
    c.moveTo(100, 42);
    c.lineTo(117, 46);
    c.lineTo(99, 49);
    c.fill();
    c.strokeStyle = '#665647';
    c.lineWidth = 2;
    for (const x of [58, 73]) {
      c.beginPath();
      c.moveTo(x, 75);
      c.lineTo(x - 2, 86);
      c.lineTo(x + 7, 86);
      c.stroke();
    }
  });
}
export function laundryTexture(colour: string, isShirt: boolean) {
  return canvasTexture(128, 160, (c) => {
    c.beginPath();
    const points = isShirt
      ? [
          [35, 12],
          [50, 8],
          [64, 18],
          [78, 8],
          [93, 12],
          [119, 38],
          [103, 62],
          [90, 53],
          [91, 147],
          [37, 147],
          [38, 53],
          [25, 62],
          [9, 38],
        ]
      : [
          [23, 10],
          [105, 10],
          [108, 149],
          [20, 149],
        ];
    points.forEach(([x, y]) => c.lineTo(x!, y!));
    c.closePath();
    c.fillStyle = colour;
    c.fill();
    c.save();
    c.clip();
    for (let x = 25; x < 108; x += 22) {
      const fold = c.createLinearGradient(x, 0, x + 18, 0);
      fold.addColorStop(0, 'rgba(81, 92, 76, .15)');
      fold.addColorStop(0.5, 'rgba(255,255,235,.22)');
      fold.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = fold;
      c.fillRect(x, 10, 18, 140);
    }
    c.restore();
    c.fillStyle = '#947351';
    c.fillRect(32, 5, 5, 16);
    c.fillRect(91, 5, 5, 16);
  });
}

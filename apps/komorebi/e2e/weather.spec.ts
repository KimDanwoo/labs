import { expect, test } from '@playwright/test';
import { SCENERY_STYLE } from '../src/views/walk/lib/breeze';
import { INDOOR_WEATHER_GLSL } from '../src/views/walk/lib/indoorWeather';

test('indoor rain renders through home and school windows and falls downward', async ({ page }) => {
  await page.goto('/404.html');
  const result = await page.evaluate(
    ({ shader, styles }) => {
      const canvas = document.createElement('canvas');
      canvas.width = 1536;
      canvas.height = 1024;
      const gl = canvas.getContext('webgl');
      if (!gl) throw new Error('WebGL unavailable');
      const compile = (type: number, source: string) => {
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Shader allocation failed');
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
          throw new Error(gl.getShaderInfoLog(shader) ?? 'Compile failed');
        return shader;
      };
      const program = gl.createProgram();
      if (!program) throw new Error('Program allocation failed');
      gl.attachShader(
        program,
        compile(
          gl.VERTEX_SHADER,
          'attribute vec2 position; varying vec2 uv; void main(){ uv=position*.5+.5; gl_Position=vec4(position,0.,1.); }',
        ),
      );
      gl.attachShader(
        program,
        compile(
          gl.FRAGMENT_SHADER,
          `precision highp float; varying vec2 uv; uniform float sceneryStyle; uniform float sceneryTime; uniform float night; ${shader} void main(){gl_FragColor=vec4(indoorWeather(vec3(.6),uv),1.);}`,
        ),
      );
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS))
        throw new Error(gl.getProgramInfoLog(program) ?? 'Link failed');
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const attribute = gl.getAttribLocation(program, 'position');
      gl.enableVertexAttribArray(attribute);
      gl.vertexAttribPointer(attribute, 2, gl.FLOAT, false, 0, 0);
      gl.uniform1f(gl.getUniformLocation(program, 'outdoorRain'), 1);
      const render = (style: number, time: number) => {
        gl.uniform1f(gl.getUniformLocation(program, 'sceneryStyle'), style);
        gl.uniform1f(gl.getUniformLocation(program, 'sceneryTime'), time);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        const pixels = new Uint8Array(canvas.width * canvas.height * 4);
        gl.readPixels(0, 0, canvas.width, canvas.height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      };
      const channel = (pixels: Uint8Array, x: number, y: number) => pixels[((1023 - y) * 1536 + x) * 4] ?? 0;
      const panes = [
        { style: styles.home, x: 250, y: 450 },
        { style: styles.classroom, x: 165, y: 350 },
        { style: styles.hallway, x: 250, y: 450 },
      ].map(({ style, x, y }) => {
        const first = render(style, 1);
        const second = render(style, 1.015625);
        let changes = 0;
        for (let dy = -20; dy <= 20; dy++) {
          for (let dx = -20; dx <= 20; dx++)
            changes += Math.abs(channel(first, x + dx, y + dy) - channel(second, x + dx, y + dy));
        }
        return { window: channel(first, x, y), floor: channel(first, 800, 850), changes };
      });
      const first = render(styles.home, 1);
      const second = render(styles.home, 1.015625);
      let best = { error: Infinity, dx: 0, dy: 0 };
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          let error = 0;
          for (let y = 350; y < 570; y++) {
            for (let x = 200; x < 330; x++) error += Math.abs(channel(first, x, y) - channel(second, x + dx, y + dy));
          }
          if (error < best.error) best = { error, dx, dy };
        }
      }
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return { panes, motion: best };
    },
    { shader: INDOOR_WEATHER_GLSL, styles: SCENERY_STYLE },
  );
  for (const pane of result.panes) {
    expect(pane.window).toBeLessThan(153);
    expect(pane.floor).toBe(153);
    expect(pane.changes).toBeGreaterThan(100);
  }
  expect(result.motion.dy).toBeGreaterThan(0);
  expect(result.motion.dx).toBeLessThan(0);
});

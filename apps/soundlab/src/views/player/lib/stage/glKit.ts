export type Program = { program: WebGLProgram; uniforms: Record<string, WebGLUniformLocation | null> };
export type Target = { texture: WebGLTexture; framebuffer: WebGLFramebuffer; width: number; height: number };

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('셰이더를 만들 수 없습니다');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader) ?? '셰이더 컴파일 실패');
  }
  return shader;
}

export function link(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
  names: readonly string[],
): Program {
  const program = gl.createProgram();
  if (!program) throw new Error('프로그램을 만들 수 없습니다');
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSource);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.detachShader(program, vertex);
  gl.detachShader(program, fragment);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? '프로그램 링크 실패');
  }
  const uniforms: Record<string, WebGLUniformLocation | null> = {};
  for (const name of names) uniforms[name] = gl.getUniformLocation(program, name);
  return { program, uniforms };
}

export function makeTarget(gl: WebGL2RenderingContext, width: number, height: number): Target {
  const texture = gl.createTexture();
  const framebuffer = gl.createFramebuffer();
  if (!texture) throw new Error('렌더 타깃을 만들 수 없습니다');
  if (!framebuffer) throw new Error('렌더 타깃을 만들 수 없습니다');
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { texture, framebuffer, width, height };
}

export function bindTexture(
  gl: WebGL2RenderingContext,
  unit: number,
  texture: WebGLTexture,
  location: WebGLUniformLocation | null,
) {
  gl.activeTexture(gl.TEXTURE0 + unit);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.uniform1i(location, unit);
}

export function gridUv(size: number) {
  const uv = new Float32Array(size * size * 2);
  for (let y = 0, i = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      uv[i++] = (x + 0.5) / size;
      uv[i++] = (y + 0.5) / size;
    }
  }
  return uv;
}

export function makeTargetPair(gl: WebGL2RenderingContext, width: number, height: number): [Target, Target] {
  return [makeTarget(gl, width, height), makeTarget(gl, width, height)];
}

export function clearTargets(gl: WebGL2RenderingContext, targets: readonly Target[]) {
  for (const target of targets) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
}

export function deleteTargets(gl: WebGL2RenderingContext, targets: readonly Target[]) {
  for (const target of targets) {
    gl.deleteTexture(target.texture);
    gl.deleteFramebuffer(target.framebuffer);
  }
}

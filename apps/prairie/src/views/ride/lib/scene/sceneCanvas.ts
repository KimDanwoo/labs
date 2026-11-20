export const DPR = {
  desktop: { max: 1.5, min: 1 },
  mobile: { max: 1.25, min: 0.8 },
} as const;

export const SOFTWARE_DPR_MAX = 0.6;
export const FILL_LIGHT_POSITION = [40, 35, -60] as const;

export const CANVAS_LABEL = '유니콘 Rush 3D 초원. WASD로 이동, Space로 비행, 드래그로 시점 회전';
export const PERFORMANCE_FLIPFLOPS = 3;
export const FILL_LIGHT_INTENSITY = 0.7;

const SOFTWARE_RENDERER = /swiftshader|llvmpipe|software/i;

export function isSoftwareRenderer(context: WebGLRenderingContext | WebGL2RenderingContext): boolean {
  const info = context.getExtension('WEBGL_debug_renderer_info');
  const renderer: unknown = info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : '';
  return typeof renderer === 'string' && SOFTWARE_RENDERER.test(renderer);
}

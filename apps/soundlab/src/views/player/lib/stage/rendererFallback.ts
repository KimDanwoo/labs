import { createRenderer, type Renderer } from '@views/player/lib/stage/renderer';

/**
 * 셰이더 컴파일·링크는 드라이버와 컨텍스트 상태에 달렸다 — 같은 코드가 어떤 환경에선 실패한다.
 * 무대는 시각 효과일 뿐이니 실패를 플레이어까지 끌고 내려가지 않는다. 폴백은 WebGL2가 없을 때와 같다.
 *
 * 실패한 컨텍스트는 여기서 놓아준다. 안 놓으면 브라우저 컨텍스트 한도를 야금야금 먹어서
 * (개발 중 핫리로드가 특히 그렇다) 원인이 사라진 뒤에도 계속 실패한다.
 */
export function createRendererOrFallback(canvas: HTMLCanvasElement): Renderer | null {
  try {
    return createRenderer(canvas);
  } catch {
    // 조용히 내려간다. console.error는 Next dev 오버레이를 띄워 화면을 덮는다 —
    // 폴백이 멀쩡히 도는 상황에서 흰 오버레이가 뜨는 게 더 나쁘다.
    canvas.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext();
    return null;
  }
}

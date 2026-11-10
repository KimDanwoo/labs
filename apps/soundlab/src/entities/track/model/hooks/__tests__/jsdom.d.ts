/** jsdom은 타입 선언을 싣지 않는다. 테스트가 쓰는 만큼만 선언한다. */
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string, options?: { url?: string });
    readonly window: Window & typeof globalThis;
  }
}

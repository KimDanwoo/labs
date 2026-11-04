export const BROWSER = [
  {
    id: 'q-209',
    question: 'Base64 인코딩이란 무엇인가요?',
    answer: `Base64는 **바이너리 데이터를 ASCII 문자 64개(A–Z, a–z, 0–9, +, /)로만 표현하는 인코딩 방식**입니다. 텍스트만 안전하게 통과하는 채널(이메일, JSON, URL, HTML 속성)로 바이너리를 실어 나르기 위해 만들어졌습니다.

## 동작 원리

3바이트(24비트)를 6비트씩 4조각으로 쪼개고, 각 6비트(0~63)를 문자표에 매핑합니다.

\`\`\`
"Man" → 01001101 01100001 01101110
      → 010011 010110 000101 101110
      → 19     22     5      46
      → M      W      F      u        →  "TWFu"
\`\`\`

3의 배수가 아니면 \`=\`로 패딩합니다.

**핵심 특성: 크기가 약 33% 증가합니다** (3바이트 → 4문자). 이것이 성능 판단의 기준점입니다.

## 암호화가 아닙니다 — 가장 중요한 포인트

Base64는 **누구나 즉시 되돌릴 수 있는 인코딩**입니다. 보안 기능이 전혀 없습니다.

\`\`\`js
atob('cGFzc3dvcmQ=')   // 'password'
\`\`\`

JWT의 헤더·페이로드도 Base64URL 인코딩일 뿐이라 **누구나 내용을 읽을 수 있습니다.** JWT의 보안은 서명(signature)에서 나오지 인코딩에서 나오지 않습니다. **JWT 페이로드에 민감 정보를 넣으면 안 되는 이유**입니다.

## JS에서 사용

\`\`\`js
btoa('hello')       // 'aGVsbG8='   binary → ASCII
atob('aGVsbG8=')    // 'hello'
\`\`\`

**한글은 그대로 넣으면 에러가 납니다.** \`btoa\`는 Latin-1(0~255)만 받습니다.

\`\`\`js
btoa('한글')   // ❌ InvalidCharacterError

// UTF-8을 거쳐야 함
const encode = (s) => btoa(String.fromCharCode(...new TextEncoder().encode(s)));
const decode = (b) => new TextDecoder().decode(Uint8Array.from(atob(b), c => c.charCodeAt(0)));
\`\`\`

## Base64URL

표준 Base64의 \`+\`, \`/\`, \`=\`는 URL에서 의미를 가지므로 치환한 변형입니다.

\`\`\`
+ → -    / → _    = → 제거
\`\`\`

JWT, OAuth state, URL 파라미터에 쓰입니다.

## 프론트엔드 실무 사용처

**1. Data URI — 작은 이미지·아이콘 인라인**

\`\`\`css
.icon { background-image: url('data:image/svg+xml;base64,PHN2Zy...'); }
\`\`\`

HTTP 요청 1회를 아끼지만 33% 커지고 **캐싱되지 않으며** CSS 파싱을 지연시킵니다. **판단 기준: 1~2KB 미만의 아이콘 정도만.** SVG라면 Base64보다 URL 인코딩이 더 작습니다.

**2. 파일 업로드 미리보기**

\`\`\`js
const reader = new FileReader();
reader.onload = () => setPreview(reader.result);   // data:image/png;base64,...
reader.readAsDataURL(file);
\`\`\`

**3. Basic 인증 헤더** — \`Authorization: Basic <base64(user:pass)>\`. 평문과 다름없으므로 반드시 HTTPS 위에서만.

**4. LLM 멀티모달 이미지 전송** — API가 Base64 입력을 받는 경우가 많습니다. 다만 33% 페이로드 증가와 토큰 비용을 고려해야 합니다.

## 성능 판단

| | Base64 인라인 | 별도 파일 |
| --- | --- | --- |
| 요청 수 | 0 | 1 |
| 크기 | +33% | 원본 |
| 캐싱 | ❌ (부모 문서와 함께) | ⭕ 독립 캐싱 |
| 병렬 다운로드 | ❌ | ⭕ |
| 렌더 블로킹 | CSS에 넣으면 ⭕ | ❌ |

**HTTP/2 이후 요청 다중화가 저렴해져 Base64 인라인의 이점이 크게 줄었습니다.** 큰 이미지를 Base64로 넣는 것은 대부분 안티패턴입니다.

> 면접 답변: "바이너리를 텍스트 채널로 안전하게 옮기는 인코딩이고, 크기가 33% 늘어납니다. **암호화가 아니라는 점**과, 그래서 JWT 페이로드가 공개 정보라는 점이 핵심입니다."`,
    sub_category: '인코딩',
    difficulty: 'easy',
    tags: ['Base64', 'Data URI', 'JWT', 'btoa', '인코딩'],
  },
  {
    id: 'q-210',
    question: '하이브리드 앱 개발에서 웹뷰와 앱이 소통할 수 있는 방법은 무엇인가요?',
    answer: `하이브리드 앱은 네이티브 셸 안에 **WebView**를 띄워 웹 콘텐츠를 보여주는 구조입니다. 웹은 카메라·푸시·생체인증 같은 네이티브 기능이 필요하고, 네이티브는 웹의 상태 변화를 알아야 하므로 **양방향 통신(브릿지)**이 필요합니다.

## 웹 → 네이티브

**Android (\`@JavascriptInterface\`)**

\`\`\`kotlin
class Bridge(val ctx: Context) {
  @JavascriptInterface
  fun openCamera(payload: String) { /* ... */ }
}
webView.addJavascriptInterface(Bridge(this), "AndroidBridge")
\`\`\`

\`\`\`js
window.AndroidBridge.openCamera(JSON.stringify({ maxSize: 5 }));
\`\`\`

**iOS (\`WKScriptMessageHandler\`)**

\`\`\`swift
config.userContentController.add(self, name: "iosBridge")
func userContentController(_ uc: WKUserContentController, didReceive message: WKScriptMessage) { }
\`\`\`

\`\`\`js
window.webkit.messageHandlers.iosBridge.postMessage({ type: 'OPEN_CAMERA' });
\`\`\`

**플랫폼 차이를 흡수하는 래퍼가 필수입니다.**

\`\`\`ts
type BridgeMessage = { type: string; payload?: unknown; requestId?: string };

function postToNative(msg: BridgeMessage) {
  const json = JSON.stringify(msg);
  if (window.AndroidBridge?.postMessage) window.AndroidBridge.postMessage(json);
  else if (window.webkit?.messageHandlers?.iosBridge) window.webkit.messageHandlers.iosBridge.postMessage(json);
  else console.warn('네이티브 브릿지 없음 — 웹 폴백 실행');
}
\`\`\`

## 네이티브 → 웹

**JS 직접 실행**

\`\`\`kotlin
webView.evaluateJavascript("window.onNativeEvent('\\{\"type\":\"PUSH\"}')", null)   // Android
\`\`\`
\`\`\`swift
webView.evaluateJavaScript("window.onNativeEvent(...)")                            // iOS
\`\`\`

웹은 전역 콜백이나 커스텀 이벤트를 노출해 둡니다.

\`\`\`ts
window.onNativeEvent = (json: string) => {
  window.dispatchEvent(new CustomEvent('native', { detail: JSON.parse(json) }));
};
\`\`\`

**React Native WebView**는 \`postMessage\` / \`onMessage\` / \`injectedJavaScript\`로 이 과정을 표준화해 줍니다.

## 요청-응답(Promise) 패턴 — 실무 필수

브릿지는 기본적으로 단방향 fire-and-forget입니다. 응답을 받으려면 **requestId로 짝을 맞춰야** 합니다.

\`\`\`ts
const pending = new Map<string, (v: unknown) => void>();
let seq = 0;

export function callNative<T>(type: string, payload?: unknown, timeout = 10_000): Promise<T> {
  const requestId = \`req-\${++seq}\`;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { pending.delete(requestId); reject(new Error('브릿지 타임아웃')); }, timeout);
    pending.set(requestId, (v) => { clearTimeout(timer); resolve(v as T); });
    postToNative({ type, payload, requestId });
  });
}

window.onNativeResponse = (json: string) => {
  const { requestId, data } = JSON.parse(json);
  pending.get(requestId)?.(data);
  pending.delete(requestId);
};
\`\`\`

**타임아웃은 반드시 넣으세요.** 네이티브가 응답하지 않으면 Promise가 영원히 대기합니다.

## 그 외 통신 수단

- **URL Scheme / Deep Link** — \`myapp://action?param=1\`. 레거시 방식이며 응답을 받을 수 없고 iOS에서 제약이 많습니다
- **User-Agent 커스터마이징** — 웹이 "앱 안인지" 판별하는 용도. 기능 분기에 유용
- **쿠키 / localStorage 공유** — 인증 토큰 전달에 쓰이지만 만료·동기화 문제가 있습니다

## 보안 — 여기가 핵심 위험 지점

**1. \`@JavascriptInterface\`는 웹에게 네이티브 권한을 주는 통로입니다.** XSS가 발생하면 공격자가 네이티브 API를 호출할 수 있습니다.

**2. 반드시 지킬 것**
- **오리진 검증** — 신뢰하는 도메인에서만 브릿지를 주입. \`shouldOverrideUrlLoading\`으로 외부 URL은 시스템 브라우저로 보내기
- **화이트리스트 방식** — 브릿지 메서드를 최소한으로. 범용 \`eval\`이나 파일 접근 API를 노출하지 말 것
- **입력 검증** — 웹에서 온 payload를 네이티브에서 zod급으로 검증
- **HTTPS 전용** — \`setAllowFileAccess(false)\`, mixed content 차단
- **민감 정보는 웹에 내려보내지 않기** — 토큰은 네이티브 보안 저장소(Keystore/Keychain)에 두고, 웹에는 필요한 순간만 짧게

**3. Android 하위 버전 취약점** — API 16 이하의 \`addJavascriptInterface\` 원격 코드 실행 이슈. \`minSdkVersion\`을 올려 회피합니다.

## 실무 팁

- **웹 폴백을 항상 두세요.** 같은 웹 페이지가 브라우저에서도 열릴 수 있어야 개발·테스트가 쉽습니다
- **브릿지 스펙을 타입으로 공유**하고 버전 필드를 넣으세요. 앱 스토어 심사 때문에 네이티브와 웹의 배포 주기가 다르므로, 구버전 앱에서 신규 브릿지를 호출하면 조용히 실패합니다
- **기능 감지 후 호출** — \`if (hasNativeFeature('camera'))\` 형태로 버전 협상

> 면접 답변: "Android는 \`@JavascriptInterface\`, iOS는 \`WKScriptMessageHandler\`, 반대 방향은 \`evaluateJavascript\`입니다. 실무에서 중요한 건 **플랫폼 차이를 흡수하는 래퍼**, **requestId 기반 Promise화**, **타임아웃**, 그리고 **브릿지가 XSS의 공격 표면이 된다는 보안 인식**입니다."`,
    sub_category: '하이브리드',
    difficulty: 'hard',
    tags: ['웹뷰', '하이브리드', '브릿지', 'postMessage', '보안'],
  },
  {
    id: 'q-211',
    question: '크로스 브라우징이란 무엇인가요?',
    answer: `크로스 브라우징(Cross Browsing)은 **브라우저·기기·OS가 달라도 동일하거나 동등한 사용자 경험을 제공하도록 만드는 작업**입니다. "모든 브라우저에서 픽셀까지 똑같이"가 아니라 **"어디서든 핵심 기능이 동작한다"**가 목표입니다.

## 차이가 생기는 원인

- **렌더링 엔진** — Blink(Chrome, Edge, 삼성브라우저), WebKit(Safari), Gecko(Firefox)
- **기본 스타일(UA stylesheet)** — 브라우저마다 \`margin\`, 폼 요소 외형이 다름
- **기능 지원 격차** — 신규 CSS·JS API의 도입 시점 차이
- **iOS의 특수성** — iOS의 모든 브라우저는 **내부적으로 WebKit**입니다. iOS Chrome은 Chrome이 아닙니다
- **모바일 고유 이슈** — 100vh와 주소창, 터치 이벤트, 안전영역(notch)

## 대응 전략

**1. 표준 준수 + 기능 감지**

\`\`\`js
// ❌ User-Agent 스니핑 — 위조 가능하고 유지보수 지옥
if (navigator.userAgent.includes('Safari')) { }

// ⭕ 기능 감지
if ('IntersectionObserver' in window) { }
if (CSS.supports('display', 'grid')) { }
\`\`\`

\`\`\`css
@supports (backdrop-filter: blur(8px)) { }
\`\`\`

**2. 리셋 / 노멀라이즈 CSS** — UA 기본 스타일의 차이를 제거하는 출발점.

**3. 자동 프리픽스** — Autoprefixer(PostCSS)가 \`browserslist\` 설정을 읽어 필요한 벤더 프리픽스만 붙입니다. 손으로 쓰지 마세요.

\`\`\`json
"browserslist": ["> 0.5%", "last 2 versions", "not dead"]
\`\`\`

이 설정 하나가 Babel 트랜스파일 타깃, Autoprefixer, Next.js 빌드에 동시에 적용됩니다.

**4. 트랜스파일 + 폴리필**
- **Babel/SWC** — 최신 문법을 구형 문법으로 변환
- **core-js** — 없는 API를 구현으로 채움
- 문법은 트랜스파일로, **API는 폴리필로** 해결된다는 구분이 중요합니다

**5. 점진적 향상 / 우아한 저하**
- **Progressive Enhancement** — 기본 기능을 먼저 보장하고 지원되는 환경에 향상 추가 (권장)
- **Graceful Degradation** — 최신 기준으로 만들고 구형에서 기능을 덜어냄

## 자주 만나는 실전 이슈

| 이슈 | 대응 |
| --- | --- |
| iOS Safari \`100vh\`가 주소창을 포함해 넘침 | \`100dvh\`(dynamic viewport) 사용 |
| iOS 입력 시 화면 자동 확대 | input \`font-size: 16px\` 이상 |
| Safari의 \`gap\` in flexbox (구버전) | 폴백 마진 |
| 날짜 파싱 차이 | \`new Date('2026-08-07')\` ISO 포맷만 사용 |
| 스크롤 동작 | \`-webkit-overflow-scrolling\`, \`scroll-behavior\` |
| 노치 영역 | \`env(safe-area-inset-*)\` |
| 폼 요소 외형 | \`appearance: none\` 후 직접 스타일링 |

## 검증 방법

- **caniuse.com** — 기능별 지원 현황 확인. 코드 쓰기 전에
- **BrowserStack / Sauce Labs** — 실제 기기·브라우저 원격 테스트
- **Playwright** — Chromium/WebKit/Firefox 3엔진에서 E2E 자동 실행. CI에 붙이기 가장 현실적인 방법
- **실기기 테스트** — 에뮬레이터가 못 잡는 iOS 이슈가 많습니다

## 지원 범위를 먼저 정하세요

기술 문제가 아니라 **비즈니스 판단**입니다. GA·서버 로그로 실사용자 브라우저 분포를 확인하고, 점유율 1% 미만 브라우저에 들일 비용을 계산하세요. IE는 2022년 지원 종료되어 대부분의 프로젝트에서 대상이 아닙니다.

> 면접 답변: "핵심은 **UA 스니핑이 아니라 기능 감지**, **browserslist 기반 자동화**(Autoprefixer/Babel), **점진적 향상**입니다. 그리고 '모든 브라우저에서 똑같이'가 아니라 '지원 범위를 정하고 그 안에서 동등한 경험'을 목표로 잡는 게 실무적입니다."`,
    sub_category: '호환성',
    difficulty: 'medium',
    tags: ['크로스브라우징', '폴리필', 'browserslist', '기능감지', 'Playwright'],
  },
];

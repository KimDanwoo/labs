/**
 * GA4 방문 통계(한 번만 실행된다). ClientRouter는 페이지를 옮길 때 문서를 새로 받지 않아
 * gtag의 자동 page_view가 첫 진입만 잡으므로, 자동 전송을 끄고 화면 전환마다 직접 보낸다.
 * GA4 향상된 측정의 "브라우저 방문 기록 이벤트 기반 페이지 변경"은 꺼 둬야 이중 집계되지 않는다.
 */
const MEASUREMENT_ID = 'G-EHWN21GFLV';
// 로컬 dev·preview 방문이 통계에 섞이지 않게 실제 도메인에서만 보낸다
const TRACKED_HOSTNAMES = new Set(['log.danwoo.dev', 'danwoo.dev']);

const dataLayer: unknown[] = [];

// gtag.js는 배열이 아니라 arguments 객체를 넣어야 명령으로 해석한다
function gtag(..._command: unknown[]): void {
  dataLayer.push(arguments);
}

function loadGtagScript(): void {
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.append(script);
}

// 화면 전환 뒤에도 document.referrer는 첫 진입 출처로 남으므로 직전에 보낸 주소를 referrer로 쓴다
let previousUrl = document.referrer;

function sendPageView(): void {
  gtag('event', 'page_view', {
    page_location: location.href,
    page_referrer: previousUrl,
    page_title: document.title,
  });
  previousUrl = location.href;
}

if (TRACKED_HOSTNAMES.has(location.hostname)) {
  Object.assign(window, { dataLayer });
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID, { send_page_view: false });
  loadGtagScript();
  document.addEventListener('astro:page-load', sendPageView);
}

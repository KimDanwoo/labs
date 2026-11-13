/**
 * GA4 방문 통계(한 번만 실행된다). 첫 진입의 page_view는 gtag config가 보낸다
 * (`send_page_view: false`를 줘도 첫 page_view가 나가는 것을 확인해 기본 동작에 맡긴다).
 * ClientRouter는 페이지를 옮길 때 문서를 새로 받지 않으므로 그 뒤 화면 전환만 직접 보낸다.
 * GA4 향상된 측정의 "브라우저 방문 기록 이벤트 기반 페이지 변경"은 꺼 둬야 이중 집계되지 않는다.
 */
const MEASUREMENT_ID = 'G-EHWN21GFLV';
// 로컬 dev·preview 방문이 통계에 섞이지 않게 실제 도메인에서만 보낸다
const TRACKED_HOSTNAME = 'danwoo.dev';

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

// 첫 진입 주소로 시작해 astro:page-load의 첫 발생(= config가 이미 보낸 진입)을 건너뛴다.
// document.referrer는 화면 전환 뒤에도 첫 진입 출처로 남으므로 직전 주소를 referrer로 쓴다
let previousUrl = location.href;

function sendPageViewOnNavigation(): void {
  if (location.href === previousUrl) return;
  gtag('event', 'page_view', {
    page_location: location.href,
    page_referrer: previousUrl,
    page_title: document.title,
  });
  previousUrl = location.href;
}

if (location.hostname === TRACKED_HOSTNAME) {
  Object.assign(window, { dataLayer });
  gtag('js', new Date());
  gtag('config', MEASUREMENT_ID);
  loadGtagScript();
  document.addEventListener('astro:page-load', sendPageViewOnNavigation);
}

import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { OverlayScrollbars, type PartialOptions } from 'overlayscrollbars';

const SCROLLBAR_OPTIONS: PartialOptions = {
  scrollbars: { theme: 'os-theme-dansoon', autoHide: 'scroll', autoHideDelay: 800 },
};
const DESKTOP_QUERY = '(width >= 64rem)';
const SIDEBAR_FOCUS_RATIO = 1 / 3;
const RESTORE_WAIT_MS = 3_000;
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
const SCROLLBAR_INITIALIZE_ATTR = 'data-overlayscrollbars-initialize';
// details name 그룹은 문서 전체에 걸린다. 서랍 복제본을 따로 묶지 않으면 끼워 넣는 순간 열린 카테고리가 닫힌다
const DRAWER_CATEGORY_GROUP = 'drawer-category';

const desktop = window.matchMedia(DESKTOP_QUERY);

const remeasuredHosts = new WeakSet<HTMLElement>();

/**
 * 라이브러리는 DOM이 바뀐 순간에만 넘침을 잰다. 접이식(details)은 `open`이 바뀐 뒤 높이 애니메이션으로 커지는데
 * 이 애니메이션은 전환 이벤트도 보내지 않아, 처음에 넘침이 없던 사이드바(홈: 카테고리가 모두 접힘)는 펼친 뒤에도
 * overflow: hidden으로 남아 휠이 먹지 않았다 — 내용 크기가 바뀔 때마다 다시 재게 한다.
 * 스크롤 영역 자체는 화면 높이로 고정이라, 실제로 커지는 안쪽 자식들을 지켜본다.
 */
function remeasureOnContentResize(host: HTMLElement, content: HTMLElement) {
  if (remeasuredHosts.has(host)) return;
  remeasuredHosts.add(host);
  const observer = new ResizeObserver(() => OverlayScrollbars(host)?.update(true));
  [...content.children].forEach((child) => observer.observe(child));
}

function attachScrollbar(host: HTMLElement) {
  const instance = OverlayScrollbars(host, SCROLLBAR_OPTIONS);
  if (instance.state().destroyed) return host;
  const { viewport, content } = instance.elements();
  remeasureOnContentResize(host, content);
  return viewport;
}

const sidebarHost = document.querySelector<HTMLElement>('[data-sidebar]');
const sidebarScroller = sidebarHost ? attachScrollbar(sidebarHost) : null;
const sidebarHeader = document.querySelector<HTMLElement>('aside [data-sidebar-header]');

function syncHeaderEdge(header: Element | null | undefined, scroller: HTMLElement) {
  header?.toggleAttribute('data-scrolled', scroller.scrollTop > 0);
}
// 유지되는 요소라도 새 문서로 옮겨 붙일 때 브라우저가 스크롤을 0으로 되돌린다 — 옮기기 전 값을 들고 있다가 되돌린다
let sidebarScrollTop = 0;
// 사용자가 굴린 위치를 바로 기억한다 — 이동 중(page-load 전)에 굴린 휠을 되돌리기가 옛 위치로 덮어쓰지 않게.
// 옮겨 붙일 때 0으로 돌아가는 건 after-swap에서 같은 작업 안에 되돌리므로, 이 이벤트가 읽는 값은 이미 복원된 위치다
sidebarScroller?.addEventListener(
  'scroll',
  () => {
    sidebarScrollTop = sidebarScroller.scrollTop;
    syncHeaderEdge(sidebarHeader, sidebarScroller);
  },
  { passive: true },
);

function restoreSidebarScroll() {
  if (sidebarScroller) sidebarScroller.scrollTop = sidebarScrollTop;
}

function scrollSidebarToCurrent() {
  const current = sidebarHost?.querySelector<HTMLElement>('details [aria-current="page"]');
  if (!sidebarScroller || !current) return;
  const offset = current.getBoundingClientRect().top - sidebarScroller.getBoundingClientRect().top;
  sidebarScroller.scrollTop += offset - sidebarScroller.clientHeight * SIDEBAR_FOCUS_RATIO;
}

const isActiveLink = (link: HTMLAnchorElement, path: string) => {
  const prefixes = link.dataset.activePrefixes?.split(' ').filter(Boolean) ?? [];
  return link.getAttribute('href') === path || prefixes.some((prefix) => path.startsWith(prefix));
};

/**
 * 사이드바(와 서랍 복제본)는 다시 그려지지 않으므로 지금 위치 표시만 바꾼다.
 * 펼친 카테고리는 건드리지 않는다 — 카테고리는 하나만 열리므로 자동으로 펼치면 다른 카테고리가 접히며 사이드바 위치가 바뀐다.
 */
function syncSidebarCurrent(root: ParentNode | null) {
  const path = window.location.pathname;
  root?.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]').forEach((link) => {
    if (isActiveLink(link, path)) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
}

// 데스크톱에서는 본문 영역이 스크롤 주체라 브라우저가 뒤로가기 위치를 기억해 주지 않는다.
// 같은 글을 여러 번 방문해도 섞이지 않도록 방문 기록 항목(ClientRouter가 붙이는 history.state.index)별로 기억한다.
const contentScrollTops = new Map<string, number>();
let contentScroller: HTMLElement | null = null;
let lastNavigationType: TransitionBeforePreparationEvent['navigationType'] | undefined;

const historyEntryKey = () => {
  const index: unknown = window.history.state?.index;
  return typeof index === 'number' ? `entry:${index}` : `path:${window.location.pathname}`;
};
// 뒤로가기(popstate)는 이벤트 시점에 이미 기록이 바뀌어 있으므로, 지금 보고 있는 항목을 따로 들고 있는다
let currentEntryKey = historyEntryKey();

/** 문서 스크롤(모바일)에 떠 있는 스크롤바를 붙인다. 원래 스크롤바가 떠 있는 기기에서는 라이브러리가 붙지 않으므로 기본 스크롤바를 되살린다. */
function attachDocumentScrollbar() {
  const instance = OverlayScrollbars(document.body, SCROLLBAR_OPTIONS);
  if (!instance.state().destroyed) return;
  document.documentElement.removeAttribute(SCROLLBAR_INITIALIZE_ATTR);
  document.body.removeAttribute(SCROLLBAR_INITIALIZE_ATTR);
}

function syncPageScroller() {
  const host = document.querySelector<HTMLElement>('[data-content-scroll]');
  if (desktop.matches) {
    OverlayScrollbars(document.body)?.destroy();
    contentScroller = host ? attachScrollbar(host) : null;
    return;
  }
  if (host) OverlayScrollbars(host)?.destroy();
  contentScroller = null;
  attachDocumentScrollbar();
}

desktop.addEventListener('change', syncPageScroller);

function restoreScrollTop(scroller: Element, top: number) {
  const hasReached = () => {
    scroller.scrollTo({ top, behavior: 'instant' });
    return scroller.scrollTop >= Math.floor(top) - 1;
  };
  if (hasReached()) return;

  const stop = new AbortController();
  const observer = new ResizeObserver(() => hasReached() && stop.abort());
  [...scroller.children].forEach((child) => observer.observe(child));
  USER_SCROLL_EVENTS.forEach((type) =>
    window.addEventListener(type, () => stop.abort(), { signal: stop.signal, passive: true }),
  );
  const timer = window.setTimeout(() => stop.abort(), RESTORE_WAIT_MS);
  stop.signal.addEventListener('abort', () => {
    observer.disconnect();
    clearTimeout(timer);
  });
}

/** 뒤로·앞으로 가기: 데스크톱은 본문 영역 위치를 직접 기억한다. 모바일은 라우터가 기록한 위치를 쓰는데, 라우터의 부드러운 스크롤은 문서 스크롤바를 다시 붙이면서 끊기므로 여기서 다시 맞춘다. */
function restoreTraversedScroll() {
  if (contentScroller) {
    restoreScrollTop(contentScroller, contentScrollTops.get(currentEntryKey) ?? 0);
    return;
  }
  const savedY: unknown = window.history.state?.scrollY;
  if (typeof savedY === 'number' && document.scrollingElement) restoreScrollTop(document.scrollingElement, savedY);
}

const mobileNav = () => document.querySelector<HTMLDialogElement>('#mobile-nav');
const mobileNavHost = document.querySelector<HTMLElement>('[data-mobile-nav-body]');
const mobileNavScroller = mobileNavHost ? attachScrollbar(mobileNavHost) : null;
// 닫힌 서랍(display: none)이나 새 문서로 옮겨 붙인 서랍은 스크롤이 0으로 돌아간다 — 열려 있을 때 값을 들고 있다가 다시 열 때 되돌린다
let mobileNavScrollTop = 0;
mobileNavScroller?.addEventListener(
  'scroll',
  () => {
    if (mobileNav()?.open) mobileNavScrollTop = mobileNavScroller.scrollTop;
    syncHeaderEdge(mobileNavHeader?.firstElementChild, mobileNavScroller);
  },
  { passive: true },
);
const mobileNavHeader = document.querySelector<HTMLElement>('[data-mobile-nav-header]');
const mobileNavContent = document.querySelector<HTMLElement>('[data-mobile-nav-content]');
const mobileNavFooter = document.querySelector<HTMLElement>('[data-mobile-nav-footer]');

function cloneSidebarForDrawer(content: Element) {
  const clone = content.cloneNode(true);
  if (!(clone instanceof Element)) return clone;
  clone.querySelectorAll('details[name]').forEach((details) => details.setAttribute('name', DRAWER_CATEGORY_GROUP));
  return clone;
}

function openMobileNav() {
  const nav = mobileNav();
  const content = sidebarHost?.querySelector('[data-sidebar-content]');
  const footer = document.querySelector('aside [data-sidebar-footer]');
  if (!nav || !mobileNavHeader || !mobileNavContent || !mobileNavFooter || !sidebarHeader || !content || !footer)
    return;
  if (mobileNavHeader.childElementCount === 0) mobileNavHeader.append(sidebarHeader.cloneNode(true));
  if (mobileNavContent.childElementCount === 0) mobileNavContent.append(cloneSidebarForDrawer(content));
  if (mobileNavFooter.childElementCount === 0) mobileNavFooter.append(footer.cloneNode(true));
  nav.showModal();
  if (!mobileNavScroller) return;
  mobileNavScroller.scrollTop = mobileNavScrollTop;
  syncHeaderEdge(mobileNavHeader.firstElementChild, mobileNavScroller);
}

// 버튼이 복제된 사이드바 안에도 있으므로 클릭은 문서에서 한 번에 받는다
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const nav = mobileNav();
  if (target?.closest('[data-nav-open]')) openMobileNav();
  if (target?.closest('[data-nav-close]') || (nav && event.target === nav)) nav?.close();
  if (target?.closest('[data-search-open]') && nav?.open) nav.close();
});

document.addEventListener('astro:before-preparation', (event) => {
  lastNavigationType = event.navigationType;
  if (contentScroller) contentScrollTops.set(currentEntryKey, contentScroller.scrollTop);
});
document.addEventListener('astro:before-swap', (event) => {
  // View Transition 애니메이션이 도는 동안(약 0.35초) 브라우저가 휠 입력을 받지 않아 사이드바 스크롤이 씹혔다.
  // 건너뛰면 ready가 거절된다 — 의도한 동작이라 받아 두지 않으면 매 이동마다 콘솔에 에러가 남는다
  event.viewTransition.ready.catch(() => undefined);
  event.viewTransition.skipTransition();
  event.newDocument.documentElement.dataset.navigated = '';
  sidebarScrollTop = sidebarScroller?.scrollTop ?? 0;
  OverlayScrollbars(document.body)?.destroy();
});
document.addEventListener('astro:after-swap', restoreSidebarScroll);

document.addEventListener('astro:page-load', () => {
  // 스크롤바 라이브러리가 크기를 다시 잴 때 위치가 흔들릴 수 있어 한 번 더 맞춘다
  restoreSidebarScroll();
  syncSidebarCurrent(sidebarHost);
  syncSidebarCurrent(mobileNavContent);
  currentEntryKey = historyEntryKey();
  syncPageScroller();
  if (lastNavigationType === 'traverse') restoreTraversedScroll();
  mobileNav()?.close();
  document.querySelectorAll<HTMLElement>('[data-overlay-scroll]').forEach(attachScrollbar);
});

scrollSidebarToCurrent();
sidebarScrollTop = sidebarScroller?.scrollTop ?? 0;

/**
 * 레이아웃 동작(한 번만 실행된다). 사이드바·모바일 서랍·검색은 페이지를 옮겨도 남아 있고(transition:persist),
 * 본문 영역은 페이지마다 새로 그려진다.
 *
 * 데스크톱(64rem 이상)은 사이드바와 본문이 각자 자기 영역만 스크롤한다(문서 전체는 스크롤하지 않는다).
 * 모바일은 사이드바가 서랍이므로 문서 전체가 스크롤된다.
 * 어느 쪽이든 스크롤바는 떠 있어서 자리를 차지하지 않는다(페이지 길이에 따라 본문이 좌우로 밀리지 않는다).
 */
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { OverlayScrollbars, type PartialOptions } from 'overlayscrollbars';

const SCROLLBAR_OPTIONS: PartialOptions = {
  scrollbars: { theme: 'os-theme-dansoon', autoHide: 'scroll', autoHideDelay: 800 },
};
const DESKTOP_QUERY = '(width >= 64rem)';
const SIDEBAR_FOCUS_RATIO = 1 / 3;
// 뒤로가기 위치가 늦게 커지는 내용(댓글·광고 iframe) 때문에 아직 없을 때, 내용이 자라길 기다리는 최대 시간
const RESTORE_WAIT_MS = 3_000;
const USER_SCROLL_EVENTS = ['wheel', 'touchstart', 'keydown', 'pointerdown'] as const;
// <html>·<body>에 붙여 두면 라이브러리가 붙기 전에도 기본 스크롤바가 숨는다(BaseLayout)
const SCROLLBAR_INITIALIZE_ATTR = 'data-overlayscrollbars-initialize';
// details name 그룹은 문서 전체에 걸린다. 서랍 복제본을 따로 묶지 않으면 끼워 넣는 순간 열린 카테고리가 닫힌다
const DRAWER_CATEGORY_GROUP = 'drawer-category';

const desktop = window.matchMedia(DESKTOP_QUERY);

/** 떠 있는 스크롤바를 붙이고, 실제로 스크롤되는 요소를 돌려준다(라이브러리가 취소되면 대상 자신). */
function attachScrollbar(host: HTMLElement) {
  const instance = OverlayScrollbars(host, SCROLLBAR_OPTIONS);
  return instance.state().destroyed ? host : instance.elements().viewport;
}

// ── 사이드바 ─────────────────────────────────────────────────
const sidebarHost = document.querySelector<HTMLElement>('[data-sidebar]');
const sidebarScroller = sidebarHost ? attachScrollbar(sidebarHost) : null;
// 유지되는 요소라도 새 문서로 옮겨 붙일 때 브라우저가 스크롤을 0으로 되돌린다 — 옮기기 전 값을 들고 있다가 되돌린다
let sidebarScrollTop = 0;

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

// ── 본문 영역 ────────────────────────────────────────────────
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

/** 스크롤 주체에 떠 있는 스크롤바를 붙인다: 데스크톱은 본문 영역, 모바일은 문서. */
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

/**
 * 저장해 둔 위치로 바로 되돌린다. 그 위치가 아직 없으면(댓글·광고가 덜 커서 페이지가 짧으면) 내용이 자랄 때마다 다시 맞추고,
 * 닿거나 사용자가 먼저 움직이거나 시간이 다 되면 멈춘다.
 */
function restoreScrollTop(scroller: Element, top: number) {
  const hasReached = () => {
    scroller.scrollTo({ top, behavior: 'instant' });
    return scroller.scrollTop >= Math.floor(top) - 1;
  };
  if (hasReached()) return;

  const stop = new AbortController();
  const observer = new ResizeObserver(() => hasReached() && stop.abort());
  [...scroller.children].forEach((child) => observer.observe(child));
  USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, () => stop.abort(), { signal: stop.signal, passive: true }));
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

// ── 모바일 서랍 ──────────────────────────────────────────────
const mobileNav = () => document.querySelector<HTMLDialogElement>('#mobile-nav');
const mobileNavHost = document.querySelector<HTMLElement>('[data-mobile-nav-body]');
const mobileNavScroller = mobileNavHost ? attachScrollbar(mobileNavHost) : null;
// 닫힌 서랍(display: none)이나 새 문서로 옮겨 붙인 서랍은 스크롤이 0으로 돌아간다 — 열려 있을 때 값을 들고 있다가 다시 열 때 되돌린다
let mobileNavScrollTop = 0;
mobileNavScroller?.addEventListener(
  'scroll',
  () => {
    if (mobileNav()?.open) mobileNavScrollTop = mobileNavScroller.scrollTop;
  },
  { passive: true },
);
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
  if (!nav || !mobileNavContent || !mobileNavFooter || !content || !footer) return;
  if (mobileNavContent.childElementCount === 0) mobileNavContent.append(cloneSidebarForDrawer(content));
  if (mobileNavFooter.childElementCount === 0) mobileNavFooter.append(footer.cloneNode(true));
  nav.showModal();
  if (mobileNavScroller) mobileNavScroller.scrollTop = mobileNavScrollTop;
}

// 버튼이 복제된 사이드바 안에도 있으므로 클릭은 문서에서 한 번에 받는다
document.addEventListener('click', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  const nav = mobileNav();
  if (target?.closest('[data-nav-open]')) openMobileNav();
  if (target?.closest('[data-nav-close]') || (nav && event.target === nav)) nav?.close();
  // 검색을 열면 서랍은 닫는다(모달 두 개가 겹치지 않게)
  if (target?.closest('[data-search-open]') && nav?.open) nav.close();
});

// ── 페이지 이동 ──────────────────────────────────────────────
document.addEventListener('astro:before-preparation', (event) => {
  lastNavigationType = event.navigationType;
  if (contentScroller) contentScrollTops.set(currentEntryKey, contentScroller.scrollTop);
});
document.addEventListener('astro:before-swap', () => {
  sidebarScrollTop = sidebarScroller?.scrollTop ?? 0;
  // <body>가 통째로 바뀌므로 문서 스크롤바는 새 <body>에 다시 붙인다(page-load)
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

// 처음 들어왔을 때만 지금 글 위치로 사이드바를 맞춘다. 이후 이동에서는 사용자가 둔 스크롤을 그대로 둔다.
scrollSidebarToCurrent();
sidebarScrollTop = sidebarScroller?.scrollTop ?? 0;

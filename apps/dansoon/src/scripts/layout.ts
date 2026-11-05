/**
 * 레이아웃 동작(한 번만 실행된다). 사이드바·모바일 서랍·검색은 페이지를 옮겨도 남아 있고(transition:persist),
 * 본문 영역은 페이지마다 새로 그려진다.
 *
 * 데스크톱(64rem 이상)은 사이드바와 본문이 각자 자기 영역만 스크롤한다(문서 전체는 스크롤하지 않는다).
 * 모바일은 사이드바가 서랍이므로 문서 전체가 스크롤된다.
 */
import type { TransitionBeforePreparationEvent } from 'astro:transitions/client';
import { OverlayScrollbars, type PartialOptions } from 'overlayscrollbars';
import 'overlayscrollbars/overlayscrollbars.css';

const SCROLLBAR_OPTIONS: PartialOptions = {
  scrollbars: { theme: 'os-theme-dansoon', autoHide: 'scroll', autoHideDelay: 800 },
};
const DESKTOP_QUERY = '(width >= 64rem)';
const SIDEBAR_FOCUS_RATIO = 1 / 3;
const SCROLL_IDLE_MS = 800;

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

/** 사이드바는 다시 그려지지 않으므로 지금 위치 표시만 바꾼다(서버가 그린 첫 화면과 같은 규칙). */
function syncSidebarCurrent() {
  const path = window.location.pathname;
  sidebarHost?.querySelectorAll<HTMLAnchorElement>('a[data-nav-link]').forEach((link) => {
    if (!isActiveLink(link, path)) {
      link.removeAttribute('aria-current');
      return;
    }
    link.setAttribute('aria-current', 'page');
    link.closest('details')?.setAttribute('open', '');
  });
}

// ── 본문 영역 ────────────────────────────────────────────────
// 데스크톱에서는 본문 영역이 스크롤 주체라 브라우저가 뒤로가기 위치를 기억해 주지 않는다 — 경로별로 직접 기억한다
const contentScrollTops = new Map<string, number>();
let contentScroller: HTMLElement | null = null;
let lastNavigationType: TransitionBeforePreparationEvent['navigationType'] | undefined;
// 뒤로가기(popstate)는 이벤트 시점에 이미 주소가 바뀌어 있으므로, 지금 보고 있는 경로를 따로 들고 있는다
let currentPath = window.location.pathname;

function attachContentScroller() {
  const host = document.querySelector<HTMLElement>('[data-content-scroll]');
  contentScroller = host && desktop.matches ? attachScrollbar(host) : null;
}

// ── 모바일 서랍 ──────────────────────────────────────────────
const mobileNav = () => document.querySelector<HTMLDialogElement>('#mobile-nav');

function openMobileNav() {
  const nav = mobileNav();
  const body = nav?.querySelector<HTMLElement>('[data-mobile-nav-body]');
  const content = sidebarHost?.querySelector('[data-sidebar-content]');
  if (!nav || !body || !content) return;
  if (body.childElementCount === 0) body.append(content.cloneNode(true));
  nav.showModal();
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

// 모바일 문서 스크롤바: 스크롤하는 동안만 보이고 멈추면 다시 투명해진다
let scrollIdleTimer = 0;
window.addEventListener(
  'scroll',
  () => {
    document.documentElement.classList.add('is-scrolling');
    clearTimeout(scrollIdleTimer);
    scrollIdleTimer = window.setTimeout(
      () => document.documentElement.classList.remove('is-scrolling'),
      SCROLL_IDLE_MS,
    );
  },
  { passive: true },
);

// ── 페이지 이동 ──────────────────────────────────────────────
document.addEventListener('astro:before-preparation', (event) => {
  lastNavigationType = event.navigationType;
  if (contentScroller) contentScrollTops.set(currentPath, contentScroller.scrollTop);
});
document.addEventListener('astro:before-swap', () => {
  sidebarScrollTop = sidebarScroller?.scrollTop ?? 0;
});
document.addEventListener('astro:after-swap', restoreSidebarScroll);

document.addEventListener('astro:page-load', () => {
  // 스크롤바 라이브러리가 크기를 다시 잴 때 위치가 흔들릴 수 있어 한 번 더 맞춘다
  restoreSidebarScroll();
  syncSidebarCurrent();
  currentPath = window.location.pathname;
  attachContentScroller();
  if (contentScroller && lastNavigationType === 'traverse') {
    contentScroller.scrollTop = contentScrollTops.get(window.location.pathname) ?? 0;
  }
  // 서랍 복제본은 지금 위치 표시가 낡으므로 다음에 열 때 새로 만든다
  const nav = mobileNav();
  nav?.querySelector('[data-mobile-nav-body]')?.replaceChildren();
  nav?.close();
  document.querySelectorAll<HTMLElement>('[data-overlay-scroll]').forEach(attachScrollbar);
});

// 처음 들어왔을 때만 지금 글 위치로 사이드바를 맞춘다. 이후 이동에서는 사용자가 둔 스크롤을 그대로 둔다.
scrollSidebarToCurrent();
sidebarScrollTop = sidebarScroller?.scrollTop ?? 0;

import { expect, test, type Page } from '@playwright/test';
import { CONTENT, EMPTY_CONTENT, QUESTION } from './fixtures.mjs';

const QUESTION_CONTENT_ROUTE = '**/api/questions';

async function mockContent(page: Page, respond: () => { status: number; body: unknown }) {
  await page.route(QUESTION_CONTENT_ROUTE, async (route) => {
    const { status, body } = respond();
    await route.fulfill({ status, json: body });
  });
}

const failed = () => ({ status: 503, body: { message: 'test content unavailable' } });

test('reference pages render categories and questions from content files', async ({ page }) => {
  const response = await page.goto('/reference');
  expect(response?.status()).toBe(200);
  await page
    .getByRole('link', { name: /JavaScript/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/reference\/javascript$/);
  await expect(page.getByRole('navigation', { name: '페이지네이션' })).toBeVisible();
});

test('reference difficulty filter and paging live in the URL', async ({ page }) => {
  await page.goto('/reference/javascript');
  await page.getByRole('group', { name: '난이도 필터' }).getByRole('link', { name: '쉬움' }).click();
  await expect(page).toHaveURL(/difficulty=easy/);
  await page.goto('/reference/javascript?page=2');
  await expect(page.getByRole('navigation', { name: '페이지네이션' }).getByText('2', { exact: true })).toBeVisible();
});

test('an empty search result renders the empty state', async ({ page }) => {
  await page.goto('/search?q=존재하지않는검색어zz');
  await expect(page.getByText('검색 결과가 없습니다. 다른 키워드로 검색해보세요.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toHaveCount(0);
});

test('a failed search shows the error boundary and retry recovers', async ({ page }) => {
  let failure = true;
  await mockContent(page, () => (failure ? failed() : { status: 200, body: CONTENT }));
  await page.goto('/search?q=JavaScript');
  await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toBeVisible();
  failure = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(page.getByRole('button', { name: /JavaScript는 무엇인가요/ })).toBeVisible();
});

test('a failed study load recovers and an empty question list stays a normal result', async ({ page }) => {
  let failure = true;
  await mockContent(page, () => (failure ? failed() : { status: 200, body: EMPTY_CONTENT }));
  await page.goto('/learn');
  await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toBeVisible();
  failure = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.getByRole('button', { name: '학습 시작', exact: true }).click();
  await expect(page.getByText('조건에 맞는 문제가 없습니다.')).toBeVisible();
});

for (const route of ['/mypage/bookmarks', '/mypage/progress']) {
  test(`${route}: content failures reach the error boundary and retry recovers`, async ({ page }) => {
    await page.addInitScript((id) => localStorage.setItem('fe-interview-bookmarks', JSON.stringify([id])), QUESTION.id);
    let failure = true;
    await mockContent(page, () => (failure ? failed() : { status: 200, body: CONTENT }));
    await page.goto(route);
    await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toBeVisible();
    failure = false;
    await page.getByRole('button', { name: '다시 시도', exact: true }).click();
    await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toHaveCount(0);
    if (route.endsWith('bookmarks')) await expect(page.getByText(QUESTION.question)).toBeVisible();
    else await expect(page.getByRole('heading', { name: /학습 현황/ })).toBeVisible();
  });
}

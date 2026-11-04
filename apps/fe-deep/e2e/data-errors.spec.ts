import { expect, test, type Page } from '@playwright/test';
import { CATEGORY, QUESTION } from './fixtures.mjs';

async function mockData(page: Page, questions: () => { status: number; body: unknown }) {
  await page.route('**/rest/v1/**', async (route) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Expose-Headers': 'Retry-After, Content-Range',
      'Retry-After': '0',
    };
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({ status: 204, headers });
      return;
    }
    const url = new URL(route.request().url());
    const response = url.pathname.endsWith('/categories') ? { status: 200, body: [CATEGORY] } : questions();
    await route.fulfill({ status: response.status, json: response.body, headers });
  });
}

const failed = () => ({ status: 503, body: { code: '08006', message: 'test database unavailable' } });

test('server-rendered reference reads categories through the data layer', async ({ page }) => {
  const response = await page.goto('/reference');
  expect(response?.status()).toBe(200);
  await expect(page.getByRole('link', { name: /JavaScript/ }).first()).toBeVisible();
});

test('an empty search result renders the empty state', async ({ page }) => {
  await mockData(page, () => ({ status: 200, body: [] }));
  await page.goto('/search?q=JavaScript');
  await expect(page.getByText('검색 결과가 없습니다. 다른 키워드로 검색해보세요.')).toBeVisible();
  await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toHaveCount(0);
});

test('a failed search shows the error boundary and retry recovers', async ({ page }) => {
  let failure = true;
  await mockData(page, () => (failure ? failed() : { status: 200, body: [QUESTION] }));
  await page.goto('/search?q=JavaScript');
  await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toBeVisible();
  await expect(page.getByText('검색 결과가 없습니다. 다른 키워드로 검색해보세요.')).toHaveCount(0);
  failure = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await expect(page.getByRole('button', { name: /JavaScript는 무엇인가요/ })).toBeVisible();
});

test('a failed study start recovers and an empty question list stays a normal result', async ({ page }) => {
  let failure = true;
  await mockData(page, () => (failure ? failed() : { status: 200, body: [] }));
  await page.goto('/learn');
  await page.getByRole('button', { name: '학습 시작', exact: true }).click();
  await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toBeVisible();
  failure = false;
  await page.getByRole('button', { name: '다시 시도', exact: true }).click();
  await page.getByRole('button', { name: '학습 시작', exact: true }).click();
  await expect(page.getByText('조건에 맞는 문제가 없습니다.')).toBeVisible();
});

for (const route of ['/mypage/bookmarks', '/mypage/progress']) {
  test(`${route}: database failures reach the error boundary and retry recovers`, async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('fe-interview-bookmarks', '["q-1"]'));
    let failure = true;
    await mockData(page, () => (failure ? failed() : { status: 200, body: [QUESTION] }));
    await page.goto(route);
    await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toBeVisible();
    failure = false;
    await page.getByRole('button', { name: '다시 시도', exact: true }).click();
    await expect(page.getByRole('heading', { name: '문제가 발생했습니다' })).toHaveCount(0);
    if (route.endsWith('bookmarks')) await expect(page.getByText(QUESTION.question)).toBeVisible();
    else await expect(page.getByRole('heading', { name: /학습 현황/ })).toBeVisible();
  });
}

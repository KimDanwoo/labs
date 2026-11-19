import { expect, type Locator, type Page } from '@playwright/test';

interface Point {
  x: number;
  z: number;
}

const STEP_MS = 150;
const ARRIVED = 1;

/** 상호작용 안내는 가까운 곳마다 하나씩 동시에 뜰 수 있다 — 기대하는 글자가 든 안내만 고른다. */
export function interactPrompt(page: Page, text: string): Locator {
  return page.locator('.interact').filter({ hasText: text });
}

/** 걸어가서 안내가 뜨기까지는 기본 대기(5초)보다 오래 걸릴 수 있다. */
export const WALK_TO_PROMPT = { timeout: 15_000 } as const;

async function readPosition(page: Page): Promise<Point> {
  const raw = await page.locator('.landscape').getAttribute('data-position');
  const [x = Number.NaN, z = Number.NaN] = (raw ?? '').split(',').map(Number);
  return { x, z };
}

function axisKeys(delta: number, negative: string, positive: string): string[] {
  if (delta > ARRIVED) return [positive];
  if (delta < -ARRIVED) return [negative];
  return [];
}

/** 도착 위치가 매번 같지 않으니 한 방향으로만 걷지 않고, 현재 위치에서 목표 쪽으로 조금씩 걸어 안내를 띄운다. */
export async function walkToPrompt(page: Page, text: string, target: Point): Promise<void> {
  await page.locator('.landscape canvas').focus();
  await expect
    .poll(
      async () => {
        if (await interactPrompt(page, text).isVisible()) return true;
        const { x, z } = await readPosition(page);
        const keys = [
          ...axisKeys(target.x - x, 'ArrowLeft', 'ArrowRight'),
          ...axisKeys(target.z - z, 'ArrowUp', 'ArrowDown'),
        ];
        for (const key of keys) await page.keyboard.down(key);
        await page.waitForTimeout(STEP_MS);
        for (const key of keys) await page.keyboard.up(key);
        return false;
      },
      { ...WALK_TO_PROMPT, intervals: [0] },
    )
    .toBe(true);
}

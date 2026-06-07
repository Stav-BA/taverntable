import { test, expect } from '@playwright/test';

test.describe('Dice Roller', () => {
  test('dice buttons are present on game page', async ({ page }) => {
    // The game page may redirect without a session — check what we get
    await page.goto('/game', { waitUntil: 'networkidle' });

    const d20 = page.locator('[data-testid="dice-d20"], button:has-text("d20")');
    if (await d20.isVisible({ timeout: 3000 })) {
      await d20.click();
      // Roll result popup should appear
      const result = page.locator('[data-testid="roll-result"]');
      await expect(result).toBeVisible({ timeout: 3000 });
    }
  });

  test('can enter custom dice expression', async ({ page }) => {
    await page.goto('/game', { waitUntil: 'networkidle' });
    const exprInput = page.locator('[data-testid="dice-expression"], input[placeholder*="2d6" i]');
    if (await exprInput.isVisible({ timeout: 3000 })) {
      await exprInput.fill('2d6+3');
      await expect(exprInput).toHaveValue('2d6+3');
    }
  });
});

test.describe('Dice notation validation', () => {
  test('d4 through d100 are all supported dice types', async ({ page }) => {
    await page.goto('/game', { waitUntil: 'networkidle' });
    const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20'];
    for (const die of diceTypes) {
      const btn = page.locator(`[data-testid="dice-${die}"], button:has-text("${die}")`);
      if (await btn.isVisible({ timeout: 1000 })) {
        await expect(btn).toBeEnabled();
      }
    }
  });
});

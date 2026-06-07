import { test, expect } from '@playwright/test';

test.describe('Join Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/join');
  });

  test('renders join form', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /join/i })).toBeVisible();
  });

  test('session code auto-uppercases input', async ({ page }) => {
    const codeInput = page.locator('input[placeholder*="code" i], input[placeholder*="קוד" i]').first();
    await codeInput.fill('abcdef');
    const value = await codeInput.inputValue();
    expect(value).toBe('ABCDEF');
  });

  test('join button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /enter|join|כנס/i })).toBeVisible();
  });

  test('token colour picker shows multiple options', async ({ page }) => {
    const tokenOptions = page.locator('[data-testid="token-option"]');
    const count = await tokenOptions.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('validates required player name', async ({ page }) => {
    // Clear the name field and try to submit
    const nameInput = page.locator('input[placeholder*="name" i], input[placeholder*="שם" i]').first();
    await nameInput.clear();
    await page.getByRole('button', { name: /enter|join|כנס/i }).click();
    // Should show validation or not navigate
    await expect(page).toHaveURL(/\/join/);
  });

  test('shows character mode options', async ({ page }) => {
    await expect(page.getByText(/new character|create|existing/i)).toBeVisible();
  });
});

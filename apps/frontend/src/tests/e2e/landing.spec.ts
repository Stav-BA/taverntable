import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders hero with tagline', async ({ page }) => {
    await expect(page.getByText(/every great adventure starts at the tavern/i)).toBeVisible();
  });

  test('has DM and player CTAs', async ({ page }) => {
    await expect(page.getByRole('link', { name: /start as dungeon master/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /join a game/i })).toBeVisible();
  });

  test('DM CTA navigates to /dm', async ({ page }) => {
    await page.getByRole('link', { name: /start as dungeon master/i }).click();
    await expect(page).toHaveURL(/\/dm/);
  });

  test('Join CTA navigates to /join', async ({ page }) => {
    await page.getByRole('link', { name: /join a game/i }).click();
    await expect(page).toHaveURL(/\/join/);
  });

  test('shows TavernTable branding', async ({ page }) => {
    await expect(page.getByText(/TavernTable/i).first()).toBeVisible();
  });

  test('is accessible on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.getByRole('link', { name: /join a game/i })).toBeVisible();
  });
});

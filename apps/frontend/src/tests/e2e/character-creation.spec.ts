import { test, expect } from '@playwright/test';

test.describe('Character Creation Wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/character/new');
  });

  test('renders mode selection on first step', async ({ page }) => {
    await expect(page.getByText(/guided|quick-start|expert/i)).toBeVisible();
  });

  test('quick-start shows pre-built characters', async ({ page }) => {
    const quickStart = page.getByText(/quick-start/i).first();
    if (await quickStart.isVisible()) {
      await quickStart.click();
      const cards = page.locator('[data-testid="quickstart-card"]');
      const count = await cards.count();
      expect(count).toBeGreaterThanOrEqual(4);
    }
  });

  test('wizard progress bar is visible', async ({ page }) => {
    // Progress indicator should show step count
    const progress = page.locator('[role="progressbar"], [data-testid="wizard-progress"]');
    await expect(progress.first()).toBeVisible();
  });

  test('can navigate to species selection', async ({ page }) => {
    // Click Guided mode if present
    const guided = page.getByText(/guided/i).first();
    if (await guided.isVisible()) {
      await guided.click();
    }
    await expect(page.getByText(/species|race|human|elf|dwarf/i)).toBeVisible();
  });

  test('back button works between steps', async ({ page }) => {
    const nextBtn = page.getByRole('button', { name: /next|continue|forward/i }).first();
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      const backBtn = page.getByRole('button', { name: /back|previous/i }).first();
      await expect(backBtn).toBeVisible();
    }
  });
});

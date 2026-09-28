import { test, expect } from '@playwright/test';

// Stub E2E test for Desktop app
test.describe('OpenStaff Desktop', () => {
  test.skip('should load the desktop app', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /OpenStaff Desktop/i })).toBeVisible();
  });

  test.todo('should interact with agent sidebar');
  
  test.todo('should send and receive chat messages');
});

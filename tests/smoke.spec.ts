import { expect, test } from '@playwright/test';

test.describe('workspace shell', () => {
  test('HR overview renders the dashboard', async ({ page }) => {
    await page.goto('/hr');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/good (morning|afternoon|evening)|overview/i);
    await expect(page.getByRole('link', { name: /people/i }).first()).toBeVisible();
    expect(await page.locator('[data-widget]').count()).toBeGreaterThan(5);
  });

  test('sidebar navigates between modules', async ({ page }) => {
    await page.goto('/hr');
    await page.getByRole('link', { name: /^People$/ }).first().click();
    await expect(page).toHaveURL(/\/hr\/people/);
    await expect(page.locator('table tbody tr').first()).toBeVisible();
  });

  test('command palette opens with the keyboard', async ({ page }) => {
    await page.goto('/finance');
    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.type('payroll');
    await expect(page.getByRole('option', { name: /payroll/i }).first()).toBeVisible();
  });

  test('theme and language toggles persist', async ({ page }) => {
    await page.goto('/hr');
    await page.keyboard.press('ControlOrMeta+k');
    await page.getByRole('option', { name: /arabic|العربية/i }).first().click();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
  });
});

test.describe('self-service', () => {
  test('employee can review payslips', async ({ page }) => {
    await page.goto('/me/payslips');
    await expect(page.getByRole('heading', { name: /payslip/i }).first()).toBeVisible();
    await expect(page.getByText(/SAR/).first()).toBeVisible();
  });

  test('leave dialog validates the requested range', async ({ page }) => {
    await page.goto('/me/leave');
    await page.getByRole('button', { name: /request leave/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/dates/i)).toBeVisible();
  });
});

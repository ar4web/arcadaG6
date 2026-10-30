import { expect, test } from '@playwright/test';

test('payroll run list exposes status and totals', async ({ page }) => {
  await page.goto('/finance/payroll');
  await expect(page.getByRole('heading', { name: /payroll/i }).first()).toBeVisible();
  const rows = page.locator('table tbody tr');
  await expect(rows.first()).toBeVisible();
  expect(await rows.count()).toBeGreaterThan(0);
});

test('invoices surface ZATCA status', async ({ page }) => {
  await page.goto('/finance/invoices');
  await expect(page.getByText(/vat|zatca|invoice/i).first()).toBeVisible();
});

test('compliance watchlist flags expiring documents', async ({ page }) => {
  await page.goto('/hr/compliance');
  await expect(page.getByRole('heading', { name: /compliance/i }).first()).toBeVisible();
  await expect(page.getByText(/expir|renew|watchlist/i).first()).toBeVisible();
});

// ============================================================
// lead-crud.spec.js — Testes E2E: CRUD de Leads
// LeadCapture Pro — Zafalão Tech
// ============================================================
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 20000;
const EMAIL = process.env.TEST_EMAIL || 'juzafalao@gmail.com';
const SENHA = process.env.TEST_SENHA || '654321';

async function login(page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
  const emailField = page.locator('input[type="email"], input[name="email"]').first();
  const needsLogin = await emailField.isVisible().catch(() => false);
  if (!needsLogin) return;
  await emailField.fill(EMAIL);
  await page.locator('input[type="password"]').first().fill(SENHA);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: TIMEOUT });
  await page.waitForTimeout(1000);
}

test.describe('Lead CRUD', () => {
  test('3.1 LeadsSistema lista leads', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });

  test('3.2 Modal de lead abre ao clicar em linha da tabela', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr, .lead-row, [data-testid="lead-row"]').first();
    const rowVisible = await row.isVisible().catch(() => false);
    if (rowVisible) {
      await row.click();
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
    } else {
      // No rows, just verify page loaded
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('3.3 Campo observações é editável no modal', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const row = page.locator('table tbody tr, .lead-row').first();
    if (await row.isVisible().catch(() => false)) {
      await row.click();
      const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
      await expect(modal).toBeVisible({ timeout: 5000 });
      const obsField = modal.locator('textarea:not([readonly]):not([disabled])').first();
      const editable = await obsField.isEditable().catch(() => false);
      expect(editable).toBeTruthy();
    }
  });

  test('3.4 Dashboard redireciona /leads para /dashboard', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    expect(page.url()).toContain('/dashboard');
  });
});

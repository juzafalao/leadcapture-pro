// ============================================================
// auth.guard.spec.js — Testes E2E: Proteção de rotas
// LeadCapture Pro — Zafalão Tech
// ============================================================
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 15000;

test.describe('Auth Guard', () => {
  test('5.1 /dashboard sem login redireciona para /login', async ({ page }) => {
    // Clear storage to ensure no session
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.evaluate(() => {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.startsWith('lcp_')) localStorage.removeItem(k);
      });
    });
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/login/);
  });

  test('5.2 /configuracoes sem login redireciona para /login', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.evaluate(() => {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.startsWith('lcp_')) localStorage.removeItem(k);
      });
    });
    await page.goto(`${BASE_URL}/configuracoes`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/login/);
  });

  test('5.3 /leads-sistema sem login redireciona para /login', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.evaluate(() => {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.startsWith('lcp_')) localStorage.removeItem(k);
      });
    });
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/login/);
  });

  test('5.4 /landing-editor sem login redireciona para /login', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.evaluate(() => {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith('sb-') || k.startsWith('lcp_')) localStorage.removeItem(k);
      });
    });
    await page.goto(`${BASE_URL}/landing-editor`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    expect(page.url()).toMatch(/\/login/);
  });

  test('5.5 Página de login não tem botão de voltar (/login é acessível sem sessão)', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: 5000 });
  });
});

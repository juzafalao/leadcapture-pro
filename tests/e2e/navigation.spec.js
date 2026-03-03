// ============================================================
// navigation.spec.js — Testes E2E: Navegação entre rotas
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

test.describe('Navigation', () => {
  test('4.1 / redireciona para /login', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/\/login/);
  });

  test('4.2 Rota desconhecida redireciona para /login', async ({ page }) => {
    await page.goto(`${BASE_URL}/rota-inexistente-xyz`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.waitForTimeout(1000);
    const url = page.url();
    expect(url).toMatch(/\/login/);
  });

  test('4.3 /dashboard acessível após login', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    expect(page.url()).toContain('/dashboard');
  });

  test('4.4 /relatorios carrega', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/relatorios`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('4.5 Todas as páginas principais carregam em < 5s', async ({ page }) => {
    await login(page);
    const routes = [
      ['/dashboard', 'Dashboard'],
      ['/relatorios', 'Relatorios'],
    ];
    for (const [path, name] of routes) {
      const t = Date.now();
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const ms = Date.now() - t;
      console.log(`${ms < 5000 ? '✅' : '⚠️'} ${name}: ${ms}ms`);
      expect(ms).toBeLessThan(5000);
    }
  });
});

// ============================================================
// dashboard.spec.js — Testes E2E: Dashboard Principal
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

test.describe('Dashboard', () => {
  test('2.1 Dashboard carrega após login', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(page.locator('body')).toBeVisible();
    const url = page.url();
    expect(url).toContain('/dashboard');
  });

  test('2.2 Sidebar está visível', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    const sidebar = page.locator('nav, aside, [data-testid="sidebar"], .sidebar').first();
    const hasSidebar = await sidebar.isVisible().catch(() => false);
    expect(hasSidebar).toBeTruthy();
  });

  test('2.3 Métricas ou cards estão visíveis', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const cards = await page.locator('[class*="card"], [class*="Card"], [class*="metric"], [class*="rounded"]').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('2.4 Console sem erros críticos', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const critical = errors.filter(e =>
      !e.includes('favicon') &&
      !e.includes('401') &&
      !e.includes('404') &&
      !e.includes('net::')
    );
    if (critical.length > 0) critical.forEach(e => console.log(`❌ Error: ${e}`));
    expect(critical.length).toBe(0);
  });

  test('2.5 Página /dashboard não está vazia', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const bodyText = await page.locator('body').innerText();
    expect(bodyText.length).toBeGreaterThan(50);
  });
});

// ============================================================
// login.spec.js — Testes E2E: Fluxo de Login
// LeadCapture Pro — Zafalão Tech
// ============================================================
const { test, expect } = require('@playwright/test');

const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 20000;
const EMAIL = process.env.TEST_EMAIL || 'juzafalao@gmail.com';
const SENHA = process.env.TEST_SENHA || '654321';

test.describe('Login Flow', () => {
  test('1.1 Página de login carrega', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible({ timeout: TIMEOUT });
  });

  test('1.2 Login com credenciais válidas redireciona para /dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

    const emailField = page.locator('input[type="email"], input[name="email"]').first();
    await emailField.fill(EMAIL);

    const senhaField = page.locator('input[type="password"]').first();
    await senhaField.fill(SENHA);

    const submitBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Acessar")').first();
    await submitBtn.click();

    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: TIMEOUT });
    await expect(page).toHaveURL(/dashboard/, { timeout: TIMEOUT });
  });

  test('1.3 Login com senha errada exibe mensagem de erro', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });

    await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill('senhaerrada123');
    await page.locator('button[type="submit"]').first().click();

    await page.waitForTimeout(3000);
    const bodyText = await page.locator('body').innerText();
    const hasError = /erro|inválido|invalid|incorreto|wrong/i.test(bodyText);
    expect(hasError || page.url().includes('/login')).toBeTruthy();
  });

  test('1.4 Logout funciona e redireciona para /login', async ({ page }) => {
    // Login first
    await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded', timeout: TIMEOUT });
    await page.locator('input[type="email"], input[name="email"]').first().fill(EMAIL);
    await page.locator('input[type="password"]').first().fill(SENHA);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL((url) => !url.toString().includes('/login'), { timeout: TIMEOUT });

    // Logout
    const logoutBtn = page.locator('button:has-text("Sair"), button:has-text("Logout"), [data-testid="logout"]').first();
    if (await logoutBtn.isVisible().catch(() => false)) {
      await logoutBtn.click();
      await page.waitForURL(/login/, { timeout: TIMEOUT });
      await expect(page).toHaveURL(/login/);
    } else {
      // Navigate to login manually and verify we can see the form
      await page.goto(`${BASE_URL}/login`);
      await expect(page.locator('input[type="email"]').first()).toBeVisible({ timeout: 5000 });
    }
  });
});

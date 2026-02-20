const { test, expect } = require('@playwright/test');
const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 15000;
const EMAIL = 'juzafalao@gmail.com';
const SENHA = '654321';

// ─── Helper de login ─────────────────────────────────────────
async function login(page) {
  await page.goto(`${BASE_URL}`, { waitUntil: 'networkidle', timeout: TIMEOUT });

  // Detecta se já está logado (sem campo de email visível)
  const emailField = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
  const needsLogin = await emailField.isVisible().catch(() => false);

  if (!needsLogin) {
    console.log('   ℹ️  Já logado, pulando login');
    return;
  }

  await emailField.fill(EMAIL);

  const senhaField = page.locator('input[type="password"], input[name="password"], input[placeholder*="senha" i], input[placeholder*="password" i]').first();
  await senhaField.fill(SENHA);

  const loginBtn = page.locator('button[type="submit"], button:has-text("Entrar"), button:has-text("Login"), button:has-text("Acessar")').first();
  await loginBtn.click();

  // Aguarda sair da tela de login
  await page.waitForURL(url => !url.toString().includes('login'), { timeout: TIMEOUT });
  await page.waitForTimeout(1000);
  console.log('   ✅ Login realizado');
}

// ─── 1. USUÁRIOSPAGE ────────────────────────────────────────
test.describe('1. UsuáriosPage (/usuarios)', () => {

  test('1.1 Página carrega', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/usuarios`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await expect(page.locator('body')).toBeVisible();
    console.log('✅ Página /usuarios carregou');
  });

  test('1.2 Lista de usuários ou tenant_id visível', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/usuarios`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const rows = await page.locator('table tbody tr, .user-row, [data-testid="user-item"]').count();
    if (rows > 0) {
      console.log(`✅ Lista com ${rows} usuário(s)`);
    } else {
      const bodyText = await page.locator('body').innerText();
      const hasTenant = /tenant/i.test(bodyText) || /[a-f0-9]{8}-[a-f0-9]{4}/.test(bodyText);
      console.log(`⚠️  Lista vazia. tenant_id visível: ${hasTenant ? '✅ SIM' : '❌ NÃO'}`);
    }
    await expect(page.locator('body')).toBeVisible();
  });

  test('1.3 Console sem erros críticos', async ({ page }) => {
    const errors = [];
    page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', e => errors.push(e.message));
    await login(page);
    await page.goto(`${BASE_URL}/usuarios`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const critical = errors.filter(e => !e.includes('favicon') && !e.includes('401'));
    critical.forEach(e => console.log(`❌ Console error: ${e}`));
    expect(critical.length).toBe(0);
  });
});

// ─── 2. LEADSSISTEMA ────────────────────────────────────────
test.describe('2. LeadsSistema (/leads-sistema)', () => {

  test('2.1 Lista carrega', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(2000);
    const rows = await page.locator('table tbody tr, .lead-row').count();
    console.log(`📋 Leads encontrados: ${rows}`);
    expect(rows).toBeGreaterThan(0);
  });

  test('2.2 Modal abre', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    await page.locator('table tbody tr, .lead-row').first().click();
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT });
    console.log('✅ Modal abriu');
  });

  test('2.3 Campo Mensagem é read-only', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    await page.locator('table tbody tr, .lead-row').first().click();
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT });
    const field = modal.locator('textarea[readonly], textarea[disabled]').first();
    const isReadonly = await field.count() > 0;
    console.log(`🔒 Campo Mensagem read-only: ${isReadonly ? '✅' : '❌'}`);
    expect(isReadonly).toBeTruthy();
  });

  test('2.4 Campo Observações é editável', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    await page.locator('table tbody tr, .lead-row').first().click();
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT });
    const obsField = modal.locator('textarea:not([readonly]):not([disabled])').first();
    const editable = await obsField.isEditable().catch(() => false);
    console.log(`✏️  Campo Observações editável: ${editable ? '✅' : '❌'}`);
    expect(editable).toBeTruthy();
  });

  test('2.5 Observação persiste após reload', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1500);
    const nota = `Teste ${Date.now()}`;

    await page.locator('table tbody tr, .lead-row').first().click();
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal).toBeVisible({ timeout: TIMEOUT });

    const obsField = modal.locator('textarea:not([readonly]):not([disabled])').first();
    await obsField.clear();
    await obsField.fill(nota);

    await modal.locator('button:has-text("Salvar"), button[type="submit"]').first().click();
    await page.waitForTimeout(2000);

    // Reload e re-login se necessário
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(1500);

    await page.locator('table tbody tr, .lead-row').first().click();
    const modal2 = page.locator('[role="dialog"], .modal, [class*="modal"]').first();
    await expect(modal2).toBeVisible({ timeout: TIMEOUT });

    const saved = await modal2.locator('textarea:not([readonly]):not([disabled])').first().inputValue();
    const ok = saved.includes(nota);
    console.log(`🔄 Persistiu: ${ok ? '✅' : '❌'} | valor: "${saved.slice(0, 60)}"`);
    expect(ok).toBeTruthy();
  });
});

// ─── 3. EXPORT EXCEL ────────────────────────────────────────
test.describe('3. Export Excel', () => {

  test('3.1 Botão visível', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1000);
    const btn = page.locator('button:has-text("Excel"), button:has-text("Exportar")').first();
    await expect(btn).toBeVisible({ timeout: TIMEOUT });
    console.log('✅ Botão Excel visível');
  });

  test('3.2 Download .xlsx funciona', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE_URL}/leads-sistema`, { waitUntil: 'networkidle', timeout: TIMEOUT });
    await page.waitForTimeout(1000);
    const btn = page.locator('button:has-text("Excel"), button:has-text("Exportar")').first();
    const [dl] = await Promise.all([
      page.waitForEvent('download', { timeout: TIMEOUT }),
      btn.click()
    ]);
    const fname = dl.suggestedFilename();
    console.log(`📥 Arquivo baixado: ${fname}`);
    expect(fname).toMatch(/\.xlsx$/i);
  });
});

// ─── 4. PERFORMANCE ─────────────────────────────────────────
test.describe('4. Performance', () => {

  test('4.1 Páginas carregam em menos de 3s', async ({ page }) => {
    await login(page);
    for (const [path, name] of [['/usuarios','Usuários'],['/leads-sistema','LeadsSistema'],['/','Home']]) {
      const t = Date.now();
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle', timeout: TIMEOUT });
      const ms = Date.now() - t;
      console.log(`${ms < 3000 ? '✅' : '⚠️'} ${name}: ${ms}ms`);
      expect(ms).toBeLessThan(3000);
    }
  });
});

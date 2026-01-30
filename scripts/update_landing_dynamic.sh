#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# LeadCapturePro | Update Landing Page (backup + dynamic tenant)
# - Faz backup do index antigo
# - Substitui por uma versão dinâmica via ?tenant=slug
# - Mantém o mesmo WEBHOOK_URL do n8n (ajuste se quiser)
# ============================================================

PROJECT_DIR="${HOME}/Projetos/leadcapture-pro"
LANDING_DIR="${PROJECT_DIR}/landing-page"
INDEX_FILE="${LANDING_DIR}/index.html"

# Se seu arquivo estiver em outro lugar, ajuste aqui:
# INDEX_FILE="${PROJECT_DIR}/landing-page/index.html"

TIMESTAMP="$(date +"%Y%m%d_%H%M%S")"
BACKUP_FILE="${INDEX_FILE}.bak_${TIMESTAMP}"

echo "== LeadCapturePro | Landing Page Dynamic Update =="
echo "Project: ${PROJECT_DIR}"
echo "Index:   ${INDEX_FILE}"

# 1) Validar caminho
if [[ ! -f "${INDEX_FILE}" ]]; then
  echo "❌ Não encontrei o index em: ${INDEX_FILE}"
  echo "➡️ Ajuste a variável INDEX_FILE dentro deste script."
  exit 1
fi

# 2) Backup
cp -v "${INDEX_FILE}" "${BACKUP_FILE}"
echo "✅ Backup criado: ${BACKUP_FILE}"

# 3) Escrever novo index dinâmico
cat > "${INDEX_FILE}" <<'HTML'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title id="pageTitle">LeadCapture Pro | Seu Produto</title>

  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'brand-orange': '#f97316',
            'brand-blue': '#3b82f6',
            'brand-dark': '#111827',
          }
        }
      }
    }
  </script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #111827 0%, #1f2937 100%); }
    .glow-orange { box-shadow: 0 0 60px rgba(249, 115, 22, 0.3); }
    .glow-blue { box-shadow: 0 0 60px rgba(59, 130, 246, 0.2); }
    .text-gradient {
      background: linear-gradient(90deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
    }
  </style>
</head>

<body class="gradient-bg min-h-screen text-white" style="--primary:#f97316; --secondary:#3b82f6">

  <!-- Background Effects -->
  <div class="fixed inset-0 overflow-hidden pointer-events-none">
    <div class="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl" style="background: color-mix(in srgb, var(--primary) 12%, transparent);"></div>
    <div class="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl" style="background: color-mix(in srgb, var(--secondary) 10%, transparent);"></div>
    <div class="absolute inset-0 opacity-5"
         style="background-image: linear-gradient(rgba(249,115,22,0.1) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(249,115,22,0.1) 1px, transparent 1px);
                background-size: 50px 50px;">
    </div>
  </div>

  <!-- Main Content -->
  <div class="relative z-10 max-w-6xl mx-auto px-4 py-8">

    <!-- Header -->
    <header class="flex justify-between items-center mb-12">
      <div class="flex items-center gap-3">
        <!-- Logo do APP (fixo) -->
        <img id="appLogo" src="logo.jpg" alt="LeadCapture Pro" class="h-10 w-auto rounded-lg" onerror="this.style.display='none'">
        <div>
          <h1 class="text-xl font-bold">
            <span id="appNameLeft" style="color:var(--primary)">Lead</span><span id="appNameMid" style="color:var(--secondary)">Capture</span><span id="appNameRight" style="color:var(--primary)"> Pro</span>
          </h1>
          <p id="subHeader" class="text-xs text-gray-500 -mt-0.5">Landing page de captação (demo)</p>
        </div>
      </div>

      <!-- Contato (pode ser fake) -->
      <a id="phoneLink" href="tel:+5517997142901" class="hidden sm:flex items-center gap-2 text-gray-400 hover:text-white transition">
        <span>📞</span>
        <span id="phoneText">(17) 99714-2901</span>
      </a>
    </header>

    <!-- Hero Section -->
    <main class="grid lg:grid-cols-2 gap-12 items-center">

      <!-- Left Column -->
      <div class="space-y-6">
        <div id="pill" class="inline-block px-4 py-2 rounded-full text-sm font-medium"
             style="background: color-mix(in srgb, var(--primary) 18%, transparent); color: color-mix(in srgb, var(--primary) 80%, white);">
          🚀 Captação Inteligente de Leads
        </div>

        <h2 class="text-4xl lg:text-5xl font-bold leading-tight">
          <span id="heroTitlePrefix">Conheça o</span>
          <span id="heroProductName" class="text-gradient">Seu Produto</span>
          <span id="heroTitleSuffix">e receba uma proposta</span>
        </h2>

        <p id="heroSubtitle" class="text-xl text-gray-300">
          Uma solução moderna para acelerar resultados com atendimento, automação e organização de oportunidades.
          Ideal para empresas que valorizam <span style="color:var(--primary); font-weight:700;">performance</span> e <span style="color:var(--secondary); font-weight:700;">processo</span>.
        </p>

        <div class="space-y-4" id="bullets">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
            <span>Implementação rápida e <strong class="text-white">sem complicação</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
            <span>Mais controle de leads e <strong class="text-white">menos perda</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
            <span>Suporte e onboarding <strong class="text-white">completo</strong></span>
          </div>
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">✓</div>
            <span>Modelo escalável e <strong class="text-white">personalizável</strong></span>
          </div>
        </div>
      </div>

      <!-- Right Column - Form -->
      <div class="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50 glow-orange">
        <div class="text-center mb-6">
          <h3 id="formTitle" class="text-2xl font-bold mb-2">Quero saber mais!</h3>
          <p id="formSubtitle" class="text-gray-400">Preencha o formulário e entraremos em contato</p>
        </div>

        <form id="leadForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Nome completo *</label>
            <input type="text" name="nome" required placeholder="Digite seu nome"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition"
              style="border-color: rgba(148,163,184,.35); outline: none;"
              />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Email *</label>
            <input type="email" name="email" required placeholder="seu@email.com"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition"
              style="border-color: rgba(148,163,184,.35); outline: none;"
              />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">WhatsApp *</label>
            <input type="tel" name="telefone" required placeholder="(11) 99999-9999"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition"
              style="border-color: rgba(148,163,184,.35); outline: none;"
              />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Faixa de investimento (opcional)</label>
            <select name="capital"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-1 transition"
              style="border-color: rgba(148,163,184,.35); outline: none;"
              >
              <option value="">Selecione uma opção</option>
              <option value="ate-50k">Até R$ 50.000</option>
              <option value="50k-100k">R$ 50.000 a R$ 100.000</option>
              <option value="100k-150k">R$ 100.000 a R$ 150.000</option>
              <option value="150k-200k">R$ 150.000 a R$ 200.000</option>
              <option value="acima-200k">Acima de R$ 200.000</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Região de interesse (opcional)</label>
            <input type="text" name="regiao" placeholder="Ex: São Paulo - Capital"
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition"
              style="border-color: rgba(148,163,184,.35); outline: none;"
              />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-2">Mensagem (opcional)</label>
            <textarea name="mensagem" rows="3" placeholder="Conte rapidamente sua necessidade..."
              class="w-full px-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-1 transition resize-none"
              style="border-color: rgba(148,163,184,.35); outline: none;"
              ></textarea>
          </div>

          <button type="submit" id="submitBtn"
            class="w-full py-4 text-white font-bold rounded-lg transition transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style="background: linear-gradient(90deg, var(--primary), color-mix(in srgb, var(--primary) 60%, var(--secondary)));"
          >
            Quero receber uma proposta! 🚀
          </button>

          <p class="text-xs text-gray-500 text-center">
            Ao enviar, você concorda com nossa política de privacidade.
            Seus dados estão seguros e não serão compartilhados.
          </p>
        </form>

        <div id="successMessage" class="hidden text-center py-8">
          <div class="text-6xl mb-4">🎉</div>
          <h3 class="text-2xl font-bold text-green-400 mb-2">Recebemos seu contato!</h3>
          <p class="text-gray-300">Nossa equipe entrará em contato em até 24 horas.</p>
        </div>
      </div>
    </main>

    <!-- Trust Badges (fake, genérico) -->
    <section class="mt-16 py-8 border-t border-gray-800">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center" id="trustBadges">
        <div>
          <div class="text-3xl font-bold" style="color:var(--primary)">200+</div>
          <div class="text-gray-400 text-sm">Clientes atendidos</div>
        </div>
        <div>
          <div class="text-3xl font-bold" style="color:var(--primary)">15+</div>
          <div class="text-gray-400 text-sm">Anos de experiência</div>
        </div>
        <div>
          <div class="text-3xl font-bold" style="color:var(--primary)">98%</div>
          <div class="text-gray-400 text-sm">Satisfação</div>
        </div>
        <div>
          <div class="text-3xl font-bold" style="color:var(--primary)">18</div>
          <div class="text-gray-400 text-sm">Horas para contato</div>
        </div>
      </div>
    </section>

    <footer class="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
      <p>© 2026 LeadCapture Pro. Todos os direitos reservados.</p>
      <p class="mt-2">Desenvolvido por Juliana Zafalão</p>
    </footer>
  </div>

  <script>
    // ============================================================
    // CONFIG
    // ============================================================

    // ✅ Mantive igual ao seu original (ajuste se mudar):
    const WEBHOOK_URL = 'http://localhost:5678/webhook/lead-capture';

    // ⚠️ Para ficar dinâmico por tenant no Supabase, preencha:
    // - SUPABASE_URL: https://xxxx.supabase.co
    // - SUPABASE_ANON_KEY: sua anon key (public)
    //
    // Se ficar em branco, ele usa o fallback DEFAULT_TENANT.
    const SUPABASE_URL = '';        // ex: 'https://krcybmownrpfjvqhacup.supabase.co'
    const SUPABASE_ANON_KEY = '';   // ex: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9....'

    // Tenant default (caso não venha ?tenant= e/ou não consiga buscar no Supabase)
    const DEFAULT_TENANT = {
      name: 'Seu Produto',
      slug: 'seu-produto',
      primary_color: '#f97316',
      secondary_color: '#3b82f6',
      logo_url: '',         // opcional: URL de um logo do cliente
      hero_title_prefix: 'Conheça o',
      hero_title_suffix: 'e receba uma proposta',
      hero_subtitle: 'Uma solução moderna para acelerar resultados com atendimento, automação e organização de oportunidades.',
      cta_text: 'Quero receber uma proposta! 🚀'
    };

    // ============================================================
    // HELPERS
    // ============================================================

    function getQueryParam(name) {
      const url = new URL(window.location.href);
      return url.searchParams.get(name);
    }

    function applyBranding(tenant) {
      const primary = tenant.primary_color || DEFAULT_TENANT.primary_color;
      const secondary = tenant.secondary_color || DEFAULT_TENANT.secondary_color;
      document.body.style.setProperty('--primary', primary);
      document.body.style.setProperty('--secondary', secondary);

      const productName = tenant.name || DEFAULT_TENANT.name;
      document.getElementById('pageTitle').textContent = `LeadCapture Pro | ${productName}`;
      document.getElementById('heroProductName').textContent = productName;

      document.getElementById('heroTitlePrefix').textContent = tenant.hero_title_prefix || DEFAULT_TENANT.hero_title_prefix;
      document.getElementById('heroTitleSuffix').textContent = tenant.hero_title_suffix || DEFAULT_TENANT.hero_title_suffix;
      document.getElementById('heroSubtitle').innerHTML =
        (tenant.hero_subtitle || DEFAULT_TENANT.hero_subtitle) +
        ` Ideal para empresas que valorizam <span style="color:var(--primary); font-weight:700;">performance</span> e <span style="color:var(--secondary); font-weight:700;">processo</span>.`;

      document.getElementById('submitBtn').textContent = tenant.cta_text || DEFAULT_TENANT.cta_text;

      // Se você quiser usar logo do TENANT no topo (opcional), descomente:
      // if (tenant.logo_url) {
      //   const appLogo = document.getElementById('appLogo');
      //   appLogo.src = tenant.logo_url;
      //   appLogo.onerror = () => { /* mantém oculto */ };
      // }
    }

    async function fetchTenantBySlug(slug) {
      if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;

      // REST endpoint: /rest/v1/tenants?slug=eq.xxx&select=...
      const url = `${SUPABASE_URL}/rest/v1/tenants?slug=eq.${encodeURIComponent(slug)}&select=id,name,slug,primary_color,secondary_color,logo_url`;

      const res = await fetch(url, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`
        }
      });

      if (!res.ok) return null;

      const data = await res.json();
      return Array.isArray(data) && data.length ? data[0] : null;
    }

    // ============================================================
    // INIT: tenant dynamic
    // ============================================================
    (async function init() {
      const tenantSlug = getQueryParam('tenant') || DEFAULT_TENANT.slug;

      let tenant = null;
      try {
        tenant = await fetchTenantBySlug(tenantSlug);
      } catch (e) {
        tenant = null;
      }

      applyBranding(tenant || DEFAULT_TENANT);
    })();

    // ============================================================
    // FORM: phone mask + submit
    // ============================================================
    document.querySelector('input[name="telefone"]').addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 11) value = value.slice(0, 11);
      if (value.length > 6) {
        value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
      } else if (value.length > 2) {
        value = `(${value.slice(0,2)}) ${value.slice(2)}`;
      }
      e.target.value = value;
    });

    document.getElementById('leadForm').addEventListener('submit', async function(e) {
      e.preventDefault();

      const form = e.target;
      const submitBtn = document.getElementById('submitBtn');
      const successMessage = document.getElementById('successMessage');

      submitBtn.disabled = true;
      const oldText = submitBtn.textContent;
      submitBtn.textContent = 'Enviando...';

      const formData = new FormData(form);
      const tenantSlug = getQueryParam('tenant') || DEFAULT_TENANT.slug;

      const data = {
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: (formData.get('telefone') || '').replace(/\D/g, ''),
        capital: formData.get('capital') || 'Não informado',
        regiao_interesse: formData.get('regiao') || 'Não informada',
        mensagem: formData.get('mensagem') || '',
        fonte: 'website',
        tenant_slug: tenantSlug
      };

      try {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });

        if (response.ok) {
          form.style.display = 'none';
          successMessage.classList.remove('hidden');
        } else {
          throw new Error('Erro no servidor');
        }
      } catch (error) {
        console.error('Erro:', error);
        alert('Ops! Houve um erro ao enviar. Por favor, tente novamente.');
        submitBtn.disabled = false;
        submitBtn.textContent = oldText;
      }
    });
  </script>
</body>
</html>
HTML

echo "✅ Novo index dinâmico gravado."

# 4) Mensagem final
echo
echo "== COMO USAR =="
echo "1) Abra a landing:"
echo "   - Sem tenant: file://${INDEX_FILE}"
echo "   - Com tenant: file://${INDEX_FILE}?tenant=lavanderia-express"
echo
echo "2) Para buscar dados reais do tenant no Supabase:"
echo "   - Edite o index e preencha SUPABASE_URL e SUPABASE_ANON_KEY."
echo
echo "✅ Pronto."


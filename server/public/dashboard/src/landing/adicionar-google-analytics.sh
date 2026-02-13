#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 ADICIONAR GOOGLE ANALYTICS NA LANDING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

GA_ID="G-HGSQJ4R9JC"

# Criar versão atualizada
cat > index.html.new << 'HTMLGA'
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lava Lava Franquias | Invista em uma Lavanderia de Sucesso</title>
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-HGSQJ4R9JC"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-HGSQJ4R9JC');
  </script>
  
  <link rel="icon" type="image/png" href="assets/logos/favicon.png">
  <link rel="apple-touch-icon" href="assets/logos/app-icon-hd.png">
  
  <script src="https://cdn.tailwindcss.com"></script>
  
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            'cyan': { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
            'blue': { 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8' }
          }
        }
      }
    }
  </script>

  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    body { font-family: 'Inter', sans-serif; }
    @keyframes float {
      0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
      50% { transform: translateY(-30px) rotate(180deg); opacity: 0.6; }
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .bubble {
      position: absolute;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(37, 99, 235, 0.1));
      animation: float linear infinite;
      pointer-events: none;
    }
    .scroll-smooth { scroll-behavior: smooth; }
  </style>
</head>

<body class="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white scroll-smooth">
  
  <div id="bubbles" class="fixed inset-0 overflow-hidden pointer-events-none z-0"></div>

  <header id="header" class="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
    <div class="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="assets/logos/logo-horizontal.png" alt="Lava Lava" class="h-12 w-auto">
      </div>
      <a href="#formulario" class="hidden md:block px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all">
        Seja um Franqueado
      </a>
    </div>
  </header>

  <section class="relative min-h-screen flex items-center pt-20">
    <div class="max-w-7xl mx-auto px-4 py-20 grid lg:grid-cols-2 gap-12 items-center relative z-10">
      <div class="space-y-8">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full">
          <span class="w-2 h-2 bg-cyan-400 rounded-full" style="animation: pulse-dot 2s ease-in-out infinite;"></span>
          <span class="text-cyan-400 text-sm font-medium">Expansão Nacional 2026</span>
        </div>
        
        <h1 class="text-4xl md:text-6xl font-bold leading-tight">
          Invista em uma franquia de 
          <span class="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">lavanderia</span> 
          de sucesso
        </h1>
        
        <p class="text-xl text-slate-300">
          A Lava Lava é a rede de lavanderias que mais cresce no Brasil. 
          Modelo de negócio validado, suporte completo e retorno garantido.
        </p>

        <div class="flex flex-col sm:flex-row gap-4">
          <a href="#formulario" class="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-bold text-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 text-center" onclick="gtag('event', 'click', {'event_category': 'CTA', 'event_label': 'Hero CTA'});">
            Quero ser franqueado →
          </a>
          <a href="#beneficios" class="px-8 py-4 border border-slate-600 rounded-xl font-semibold hover:bg-slate-800 transition-all text-center">
            Saiba mais
          </a>
        </div>
      </div>

      <div class="relative flex items-center justify-center">
        <div class="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-3xl blur-3xl"></div>
        <img src="assets/logos/logo-hero.png" alt="Lava Lava Lavanderia" class="relative w-full max-w-md drop-shadow-2xl">
      </div>
    </div>
  </section>

  <section class="py-20 border-y border-slate-800">
    <div class="max-w-7xl mx-auto px-4">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div>
          <div class="text-4xl md:text-5xl font-bold text-white mb-2">150+</div>
          <div class="text-cyan-300 text-sm uppercase tracking-wider">Unidades</div>
        </div>
        <div>
          <div class="text-4xl md:text-5xl font-bold text-white mb-2">98%</div>
          <div class="text-cyan-300 text-sm uppercase tracking-wider">Satisfação</div>
        </div>
        <div>
          <div class="text-4xl md:text-5xl font-bold text-white mb-2">24</div>
          <div class="text-cyan-300 text-sm uppercase tracking-wider">Retorno (meses)</div>
        </div>
        <div>
          <div class="text-4xl md:text-5xl font-bold text-white mb-2">15</div>
          <div class="text-cyan-300 text-sm uppercase tracking-wider">Anos no mercado</div>
        </div>
      </div>
    </div>
  </section>

  <section id="beneficios" class="py-20">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">
          Por que escolher a <span class="text-cyan-400">Lava Lava</span>?
        </h2>
      </div>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group">
          <div class="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
          <h3 class="text-xl font-bold text-white mb-2">Modelo Validado</h3>
          <p class="text-slate-400">15 anos de experiência e mais de 150 unidades comprovam nosso sucesso.</p>
        </div>
        <div class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group">
          <div class="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">📚</div>
          <h3 class="text-xl font-bold text-white mb-2">Treinamento Completo</h3>
          <p class="text-slate-400">Capacitação presencial e online para você e sua equipe.</p>
        </div>
        <div class="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group">
          <div class="w-14 h-14 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform">💰</div>
          <h3 class="text-xl font-bold text-white mb-2">Retorno Garantido</h3>
          <p class="text-slate-400">Média de retorno do investimento em 18 a 24 meses.</p>
        </div>
      </div>
    </div>
  </section>

  <section id="formulario" class="py-20 bg-slate-800/30">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center mb-12">
        <h2 class="text-3xl md:text-4xl font-bold mb-4">
          Preencha o formulário e <span class="text-cyan-400">seja um franqueado</span>
        </h2>
        <p class="text-slate-300 text-lg">
          Nossa equipe entrará em contato em até 24 horas.
        </p>
      </div>

      <div class="max-w-2xl mx-auto bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8">
        <form id="leadForm" class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">Nome completo *</label>
              <input type="text" name="nome" required minlength="3" placeholder="Seu nome completo" class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all">
            </div>
            <div>
              <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">E-mail *</label>
              <input type="email" name="email" required placeholder="seu@email.com" class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all">
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">WhatsApp *</label>
              <input type="tel" id="telefone" name="telefone" required placeholder="(11) 99999-9999" class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all">
            </div>
            <div>
              <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">CPF ou CNPJ (opcional)</label>
              <input type="text" id="documento" name="documento" placeholder="000.000.000-00" class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all">
              <p class="text-xs text-slate-500 mt-1" id="documento-hint">Digite apenas números</p>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">Capital disponível *</label>
              <input type="text" id="capital" name="capital" required placeholder="R$ 100.000,00" class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all">
              <p class="text-xs text-slate-500 mt-1">Investimento mínimo: R$ 80.000,00</p>
            </div>
            <div>
              <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">Estado *</label>
              <select name="estado" required class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-all">
                <option value="">Selecione</option>
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amapá</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Ceará</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Espírito Santo</option>
                <option value="GO">Goiás</option>
                <option value="MA">Maranhão</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Pará</option>
                <option value="PB">Paraíba</option>
                <option value="PR">Paraná</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piauí</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rondônia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">São Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs text-slate-400 uppercase tracking-wider mb-2">Cidade *</label>
            <input type="text" name="cidade" required placeholder="Sua cidade" class="w-full px-4 py-3 bg-slate-800/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all">
          </div>

          <div id="error" class="hidden p-4 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm"></div>
          <div id="success" class="hidden p-4 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400"></div>

          <button type="submit" id="submitBtn" class="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold rounded-xl hover:from-cyan-400 hover:to-blue-500 transition-all text-lg shadow-lg shadow-cyan-500/25">
            Quero ser um franqueado →
          </button>

          <p class="text-xs text-slate-500 text-center">
            Ao enviar, você concorda em receber contato sobre a franquia Lava Lava.
          </p>
        </form>
      </div>
    </div>
  </section>

  <footer class="py-12 border-t border-slate-800">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex flex-col md:flex-row items-center justify-between gap-6">
        <img src="assets/logos/logo-horizontal.png" alt="Lava Lava" class="h-10 w-auto">
        <p class="text-slate-500 text-sm text-center">
          © 2026 Lava Lava Franquias. Todos os direitos reservados.
        </p>
        <p class="text-slate-600 text-xs">Powered by LeadCapture Pro</p>
      </div>
    </div>
  </footer>

  <script>
    const CONFIG = {
      TENANT_ID: '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
      MARCA_ID: '22222222-2222-2222-2222-222222222222',
      FONTE: 'landing-page',
      API_URL: 'http://localhost:4000/api/leads'
    }

    // Bubbles
    const bubblesContainer = document.getElementById('bubbles')
    for (let i = 0; i < 20; i++) {
      const bubble = document.createElement('div')
      bubble.className = 'bubble'
      bubble.style.width = Math.random() * 100 + 50 + 'px'
      bubble.style.height = bubble.style.width
      bubble.style.left = Math.random() * 100 + '%'
      bubble.style.top = Math.random() * 100 + '%'
      bubble.style.animationDuration = (5 + Math.random() * 10) + 's'
      bubble.style.animationDelay = Math.random() * 5 + 's'
      bubblesContainer.appendChild(bubble)
    }

    // Header scroll
    window.addEventListener('scroll', () => {
      const header = document.getElementById('header')
      if (window.scrollY > 50) {
        header.classList.add('bg-slate-900/95', 'backdrop-blur-lg', 'shadow-lg')
      } else {
        header.classList.remove('bg-slate-900/95', 'backdrop-blur-lg', 'shadow-lg')
      }
      
      // Track scroll depth
      const scrollPercent = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      
      if (scrollPercent > 25 && !window.ga_scroll_25) {
        gtag('event', 'scroll', {'event_category': 'Engagement', 'event_label': '25%'})
        window.ga_scroll_25 = true
      }
      if (scrollPercent > 50 && !window.ga_scroll_50) {
        gtag('event', 'scroll', {'event_category': 'Engagement', 'event_label': '50%'})
        window.ga_scroll_50 = true
      }
      if (scrollPercent > 75 && !window.ga_scroll_75) {
        gtag('event', 'scroll', {'event_category': 'Engagement', 'event_label': '75%'})
        window.ga_scroll_75 = true
      }
      if (scrollPercent > 95 && !window.ga_scroll_100) {
        gtag('event', 'scroll', {'event_category': 'Engagement', 'event_label': '100%'})
        window.ga_scroll_100 = true
      }
    })

    // Máscaras
    document.getElementById('telefone').addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '')
      if (value.length > 11) value = value.slice(0, 11)
      
      if (value.length > 10) {
        value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      } else if (value.length > 6) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3')
      } else if (value.length > 2) {
        value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2')
      } else if (value.length > 0) {
        value = value.replace(/^(\d*)/, '($1')
      }
      
      e.target.value = value
    })

    // CPF ou CNPJ (OPCIONAL)
    const documentoInput = document.getElementById('documento')
    const documentoHint = document.getElementById('documento-hint')
    
    documentoInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '')
      
      if (value.length <= 11) {
        if (value.length > 11) value = value.slice(0, 11)
        
        if (value.length > 9) {
          value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
        } else if (value.length > 6) {
          value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
        } else if (value.length > 3) {
          value = value.replace(/^(\d{3})(\d{0,3})/, '$1.$2')
        }
        
        documentoHint.textContent = value.length > 0 ? 'CPF' : 'Digite apenas números'
        documentoInput.placeholder = '000.000.000-00'
        
      } else {
        if (value.length > 14) value = value.slice(0, 14)
        
        if (value.length > 12) {
          value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
        } else if (value.length > 8) {
          value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4')
        } else if (value.length > 5) {
          value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3')
        } else if (value.length > 2) {
          value = value.replace(/^(\d{2})(\d{0,3})/, '$1.$2')
        }
        
        documentoHint.textContent = 'CNPJ'
        documentoInput.placeholder = '00.000.000/0000-00'
      }
      
      e.target.value = value
    })

    // Validar CPF
    function validarCPF(cpf) {
      cpf = cpf.replace(/\D/g, '')
      if (cpf.length !== 11) return false
      if (/^(\d)\1{10}$/.test(cpf)) return false
      
      let soma = 0
      for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i)) * (10 - i)
      let resto = 11 - (soma % 11)
      let digito1 = resto === 10 || resto === 11 ? 0 : resto
      if (digito1 !== parseInt(cpf.charAt(9))) return false
      
      soma = 0
      for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i)) * (11 - i)
      resto = 11 - (soma % 11)
      let digito2 = resto === 10 || resto === 11 ? 0 : resto
      
      return digito2 === parseInt(cpf.charAt(10))
    }

    // Validar CNPJ
    function validarCNPJ(cnpj) {
      cnpj = cnpj.replace(/\D/g, '')
      if (cnpj.length !== 14) return false
      if (/^(\d)\1{13}$/.test(cnpj)) return false
      
      let tamanho = cnpj.length - 2
      let numeros = cnpj.substring(0, tamanho)
      let digitos = cnpj.substring(tamanho)
      let soma = 0
      let pos = tamanho - 7
      
      for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--
        if (pos < 2) pos = 9
      }
      
      let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
      if (resultado != digitos.charAt(0)) return false
      
      tamanho = tamanho + 1
      numeros = cnpj.substring(0, tamanho)
      soma = 0
      pos = tamanho - 7
      
      for (let i = tamanho; i >= 1; i--) {
        soma += numeros.charAt(tamanho - i) * pos--
        if (pos < 2) pos = 9
      }
      
      resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
      return resultado == digitos.charAt(1)
    }

    // Capital
    document.getElementById('capital').addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '')
      if (value === '') {
        e.target.value = ''
        return
      }
      
      value = (parseInt(value) || 0).toString()
      while (value.length < 3) value = '0' + value
      
      const inteiro = value.slice(0, -2)
      const decimal = value.slice(-2)
      const inteiroFormatado = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      
      e.target.value = 'R$ ' + inteiroFormatado + ',' + decimal
    })

    // Formulário
    const form = document.getElementById('leadForm')
    const errorDiv = document.getElementById('error')
    const successDiv = document.getElementById('success')
    const submitBtn = document.getElementById('submitBtn')
    
    // Track form start
    let formStarted = false
    form.addEventListener('focus', function() {
      if (!formStarted) {
        gtag('event', 'form_start', {'event_category': 'Form', 'event_label': 'Lead Form'})
        formStarted = true
      }
    }, true)

    form.addEventListener('submit', async function(e) {
      e.preventDefault()
      
      errorDiv.classList.add('hidden')
      successDiv.classList.add('hidden')
      submitBtn.disabled = true
      submitBtn.textContent = '⏳ Enviando...'

      const formData = new FormData(form)
      
      const telefone = formData.get('telefone').replace(/\D/g, '')
      const capitalStr = formData.get('capital').replace(/[R$.\s]/g, '').replace(',', '.')
      const capital = parseFloat(capitalStr) || 0

      // Calcular score
      let score = 50
      if (capital >= 500000) score = 95
      else if (capital >= 300000) score = 90
      else if (capital >= 200000) score = 80
      else if (capital >= 150000) score = 70
      else if (capital >= 100000) score = 60
      else if (capital >= 80000) score = 55

      // Calcular categoria
      let categoria = 'cold'
      if (score >= 80) categoria = 'hot'
      else if (score >= 60) categoria = 'warm'

      // Dados do lead
      const leadData = {
        tenant_id: CONFIG.TENANT_ID,
        marca_id: CONFIG.MARCA_ID,
        fonte: CONFIG.FONTE,
        nome: formData.get('nome'),
        email: formData.get('email'),
        telefone: telefone,
        cidade: formData.get('cidade'),
        estado: formData.get('estado'),
        capital_disponivel: capital,
        score: score,
        categoria: categoria,
        status: 'novo',
        observacao: `Capital: ${formData.get('capital')} | Origem: Landing Page Lava Lava`
      }

      // DOCUMENTO É OPCIONAL
      const documentoValue = formData.get('documento')
      if (documentoValue && documentoValue.trim()) {
        const documento = documentoValue.replace(/\D/g, '')
        
        if (documento.length > 0) {
          const isDocumentoValido = documento.length === 11 ? validarCPF(documento) : validarCNPJ(documento)
          
          if (!isDocumentoValido && documento.length >= 11) {
            errorDiv.innerHTML = `
              <div class="flex items-center gap-3">
                <span class="text-2xl">❌</span>
                <div>
                  <div class="font-bold mb-1">Documento inválido</div>
                  <div class="text-sm">${documento.length === 11 ? 'CPF' : 'CNPJ'} inválido. Deixe em branco ou corrija.</div>
                </div>
              </div>
            `
            errorDiv.classList.remove('hidden')
            errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
            submitBtn.disabled = false
            submitBtn.textContent = 'Quero ser um franqueado →'
            
            // Track error
            gtag('event', 'form_error', {'event_category': 'Form', 'event_label': 'Invalid Document'})
            return
          }
          
          if (documento.length === 11 || documento.length === 14) {
            leadData.documento = documento
            leadData.tipo_documento = documento.length === 11 ? 'CPF' : 'CNPJ'
            leadData.observacao += ` | ${leadData.tipo_documento}: ${documentoValue}`
          }
        }
      }

      try {
        const response = await fetch(CONFIG.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(leadData)
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Erro ao enviar formulário')
        }

        // Track conversion
        gtag('event', 'conversion', {
          'send_to': 'G-HGSQJ4R9JC',
          'value': capital,
          'currency': 'BRL',
          'transaction_id': result.leadId
        })
        
        gtag('event', 'generate_lead', {
          'event_category': 'Form',
          'event_label': 'Lead Created',
          'value': capital,
          'currency': 'BRL'
        })

        successDiv.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-3xl">🎉</span>
            <div>
              <div class="font-bold text-lg mb-1">Formulário enviado com sucesso!</div>
              <div class="text-sm opacity-90">Nossa equipe entrará em contato em até 24 horas.</div>
            </div>
          </div>
        `
        successDiv.classList.remove('hidden')
        form.reset()
        documentoHint.textContent = 'Digite apenas números'
        documentoInput.placeholder = '000.000.000-00'
        successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })

      } catch (error) {
        // Track error
        gtag('event', 'form_error', {'event_category': 'Form', 'event_label': error.message})
        
        errorDiv.innerHTML = `
          <div class="flex items-center gap-3">
            <span class="text-2xl">❌</span>
            <div>
              <div class="font-bold mb-1">Erro ao enviar formulário</div>
              <div class="text-sm">${error.message}</div>
            </div>
          </div>
        `
        errorDiv.classList.remove('hidden')
        errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } finally {
        submitBtn.disabled = false
        submitBtn.textContent = 'Quero ser um franqueado →'
      }
    })
  </script>
</body>
</html>
HTMLGA

echo "✅ Arquivo criado com Google Analytics"
echo ""

read -p "Substituir index.html? (s/N): " confirm

if [[ $confirm =~ ^[Ss]$ ]]; then
  mv index.html.new index.html
  echo "✅ Arquivo atualizado!"
  echo ""
  echo "📊 Google Analytics adicionado:"
  echo "   Measurement ID: G-HGSQJ4R9JC"
  echo "   Eventos rastreados:"
  echo "     ✓ Visualizações de página"
  echo "     ✓ Scroll (25%, 50%, 75%, 100%)"
  echo "     ✓ Clique em CTA"
  echo "     ✓ Início de preenchimento"
  echo "     ✓ Envio de formulário (conversão)"
  echo "     ✓ Erros"
else
  echo "⏭️  Arquivo salvo como: index.html.new"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

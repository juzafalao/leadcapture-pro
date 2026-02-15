// ============================================
// SHARED.JS - JavaScript compartilhado
// ============================================

function initForm(config) {
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

  const documentoInput = document.getElementById('documento')
  const documentoHint = document.getElementById('documento-hint')
  
  if (documentoInput) {
    documentoInput.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '')
      
      if (value.length <= 11) {
        if (value.length > 11) value = value.slice(0, 11)
        
        if (value.length > 9) {
          value = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})/, '\$1.\$2.\$3-\$4')
        } else if (value.length > 6) {
          value = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, '\$1.\$2.\$3')
        } else if (value.length > 3) {
          value = value.replace(/^(\d{3})(\d{0,3})/, '\$1.\$2')
        }
        
        documentoHint.textContent = value.length > 0 ? 'CPF' : 'Digite apenas números'
        documentoInput.placeholder = '000.000.000-00'
        
      } else {
        if (value.length > 14) value = value.slice(0, 14)
        
        if (value.length > 12) {
          value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '\$1.\$2.\$3/\$4-\$5')
        } else if (value.length > 8) {
          value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})/, '\$1.\$2.\$3/\$4')
        } else if (value.length > 5) {
          value = value.replace(/^(\d{2})(\d{3})(\d{0,3})/, '\$1.\$2.\$3')
        } else if (value.length > 2) {
          value = value.replace(/^(\d{2})(\d{0,3})/, '\$1.\$2')
        }
        
        documentoHint.textContent = 'CNPJ'
        documentoInput.placeholder = '00.000.000/0000-00'
      }
      
      e.target.value = value
    })
  }

  function validarCPF(cpf) {
    cpf = cpf.replace(/\D/g, '')
    if (cpf.length !== 11) return false
    if (/^(\d)\1{10}\$/.test(cpf)) return false
    
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

  function validarCNPJ(cnpj) {
    cnpj = cnpj.replace(/\D/g, '')
    if (cnpj.length !== 14) return false
    if (/^(\d)\1{13}\$/.test(cnpj)) return false
    
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
    
    e.target.value = 'R\$ ' + inteiroFormatado + ',' + decimal
  })

  const form = document.getElementById('leadForm')
  const errorDiv = document.getElementById('error')
  const successDiv = document.getElementById('success')
  const submitBtn = document.getElementById('submitBtn')
  
  let formStarted = false
  form.addEventListener('focus', function() {
    if (!formStarted) {
      gtag('event', 'form_start', {'event_category': 'Form', 'event_label': config.MARCA_NOME})
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
    const capitalStr = formData.get('capital').replace(/[R\$.\s]/g, '').replace(',', '.')
    const capital = parseFloat(capitalStr) || 0

    let score = 50
    if (capital >= 500000) score = 95
    else if (capital >= 300000) score = 90
    else if (capital >= 200000) score = 80
    else if (capital >= 150000) score = 70
    else if (capital >= 100000) score = 60
    else if (capital >= 80000) score = 55

    let categoria = 'cold'
    if (score >= 80) categoria = 'hot'
    else if (score >= 60) categoria = 'warm'

    const leadData = {
      tenant_id: config.TENANT_ID,
      marca_id: config.MARCA_ID,
      fonte: config.FONTE,
      nome: formData.get('nome'),
      email: formData.get('email'),
      telefone: telefone,
      cidade: formData.get('cidade'),
      estado: formData.get('estado'),
      capital_disponivel: capital,
      score: score,
      categoria: categoria,
      status: 'novo',
      observacao: 'Capital: ' + formData.get('capital') + ' | Origem: Landing Page ' + config.MARCA_NOME
    }

    const documentoValue = formData.get('documento')
    if (documentoValue && documentoValue.trim()) {
      const documento = documentoValue.replace(/\D/g, '')
      
      if (documento.length > 0) {
        const isDocumentoValido = documento.length === 11 ? validarCPF(documento) : validarCNPJ(documento)
        
        if (!isDocumentoValido && documento.length >= 11) {
          errorDiv.innerHTML = '<div class="flex items-center gap-3"><span class="text-2xl">❌</span><div><div class="font-bold mb-1">Documento inválido</div><div class="text-sm">' + (documento.length === 11 ? 'CPF' : 'CNPJ') + ' inválido. Deixe em branco ou corrija.</div></div></div>'
          errorDiv.classList.remove('hidden')
          errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
          submitBtn.disabled = false
          submitBtn.textContent = 'Quero ser um franqueado →'
          
          gtag('event', 'form_error', {'event_category': 'Form', 'event_label': 'Invalid Document'})
          return
        }
        
        if (documento.length === 11 || documento.length === 14) {
          leadData.documento = documento
          leadData.tipo_documento = documento.length === 11 ? 'CPF' : 'CNPJ'
          leadData.observacao += ' | ' + leadData.tipo_documento + ': ' + documentoValue
        }
      }
    }

    try {
      const response = await fetch(config.API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(leadData)
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Erro ao enviar formulário')
      }

      gtag('event', 'conversion', {
        'send_to': config.GA_ID,
        'value': capital,
        'currency': 'BRL',
        'transaction_id': result.leadId
      })
      
      gtag('event', 'generate_lead', {
        'event_category': 'Form',
        'event_label': config.MARCA_NOME,
        'value': capital,
        'currency': 'BRL'
      })

      successDiv.innerHTML = '<div class="flex items-center gap-3"><span class="text-3xl">🎉</span><div><div class="font-bold text-lg mb-1">Formulário enviado com sucesso!</div><div class="text-sm opacity-90">Nossa equipe entrará em contato em até 24 horas.</div></div></div>'
      successDiv.classList.remove('hidden')
      form.reset()
      if (documentoHint) {
        documentoHint.textContent = 'Digite apenas números'
        documentoInput.placeholder = '000.000.000-00'
      }
      successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })

    } catch (error) {
      gtag('event', 'form_error', {'event_category': 'Form', 'event_label': error.message})
      
      errorDiv.innerHTML = '<div class="flex items-center gap-3"><span class="text-2xl">❌</span><div><div class="font-bold mb-1">Erro ao enviar formulário</div><div class="text-sm">' + error.message + '</div></div></div>'
      errorDiv.classList.remove('hidden')
      errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } finally {
      submitBtn.disabled = false
      submitBtn.textContent = 'Quero ser um franqueado →'
    }
  })
}

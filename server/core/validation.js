// ============================================================
// CORE — Serviço de Validação (MELHORADO)
// Regras centralizadas para validar dados de entrada
// LeadCapture Pro — Zafalão Tech
//
// MELHORIAS:
// - Validação real de CPF/CNPJ com dígitos verificadores
// - Escape de HTML em sanitizarTexto
// - validarSlug para segurança de landing pages
// - isUUIDValido
// ============================================================

/**
 * Valida um endereço de e-mail
 */
export function isEmailValido(email) {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(trimmed) && trimmed.length <= 255
}

/**
 * Valida um número de telefone
 */
export function isTelefoneValido(telefone) {
  const soDigitos = String(telefone ?? '').replace(/\D/g, '')
  return soDigitos.length >= 10 && soDigitos.length <= 13
}

/**
 * Valida CPF ou CNPJ
 */
export function validarDocumento(documento) {
  const limpo = String(documento ?? '').replace(/\D/g, '')

  if (limpo.length === 11) {
    const valido = validarCPF(limpo)
    return { valido, tipo: 'CPF', limpo }
  }
  if (limpo.length === 14) {
    const valido = validarCNPJ(limpo)
    return { valido, tipo: 'CNPJ', limpo }
  }

  return { valido: false, tipo: null, limpo }
}

function validarCPF(cpf) {
  if (/^(\d)\1+$/.test(cpf)) return false

  let soma = 0
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf.charAt(i)) * (10 - i)
  }
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(9))) return false

  soma = 0
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf.charAt(i)) * (11 - i)
  }
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(10))) return false

  return true
}

function validarCNPJ(cnpj) {
  if (/^(\d)\1+$/.test(cnpj)) return false

  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho)
  const digitos = cnpj.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--
    if (pos < 2) pos = 9
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0))) return false

  tamanho = tamanho + 1
  numeros = cnpj.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7

  for (let i = tamanho; i >= 1; i--) {
    soma += numeros.charAt(tamanho - i) * pos--
    if (pos < 2) pos = 9
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(1))) return false

  return true
}

/**
 * Valida campos obrigatórios
 */
export function validarCamposObrigatorios(dados, campos) {
  if (!dados || typeof dados !== 'object') {
    return { valido: false, campoFaltando: campos[0] || null }
  }

  for (const campo of campos) {
    const valor = dados[campo]
    if (valor === undefined || valor === null || String(valor).trim() === '') {
      return { valido: false, campoFaltando: campo }
    }
  }
  return { valido: true, campoFaltando: null }
}

/**
 * Sanitiza texto com escape de HTML
 */
export function sanitizarTexto(valor, maxLen = 255) {
  if (valor === null || valor === undefined) return ''

  let str = String(valor).trim()
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return str.slice(0, maxLen)
}

/**
 * Normaliza telefone
 */
export function normalizarTelefone(telefone) {
  return String(telefone ?? '').replace(/\D/g, '')
}

/**
 * Valida slug para URLs
 */
export function validarSlug(slug) {
  if (!slug || typeof slug !== 'string') {
    return { valido: false, erro: 'Slug é obrigatório' }
  }

  const trimmed = slug.trim()

  if (trimmed.length < 2 || trimmed.length > 100) {
    return { valido: false, erro: 'Slug deve ter entre 2 e 100 caracteres' }
  }

  const slugRegex = /^[a-zA-Z0-9_-]+$/
  if (!slugRegex.test(trimmed)) {
    return { valido: false, erro: 'Slug deve conter apenas letras, números, hífens e underscores' }
  }

  if (trimmed.startsWith('-') || trimmed.endsWith('-')) {
    return { valido: false, erro: 'Slug não pode começar ou terminar com hífen' }
  }

  return { valido: true }
}

/**
 * Valida UUID
 */
export function isUUIDValido(uuid) {
  if (!uuid || typeof uuid !== 'string') return false
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid.trim())
}

/**
 * Sanitiza objeto removendo campos não permitidos
 */
export function sanitizarObjeto(obj, camposPermitidos) {
  const resultado = {}
  for (const campo of camposPermitidos) {
    if (obj.hasOwnProperty(campo)) {
      resultado[campo] = obj[campo]
    }
  }
  return resultado
}

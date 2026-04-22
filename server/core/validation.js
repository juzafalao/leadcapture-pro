export function isEmailValido(email) {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim()
  if (trimmed.length > 255) return false
  const [localPart, domainPart] = trimmed.split('@')
  if (!localPart || !domainPart) return false
  if (localPart.includes('..') || domainPart.includes('..')) return false
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(trimmed)
}

export function isTelefoneValido(telefone) {
  const soDigitos = String(telefone ?? '').replace(/\D/g, '')
  return soDigitos.length >= 10 && soDigitos.length <= 13
}

export function validarDocumento(documento) {
  const limpo = String(documento ?? '').replace(/\D/g, '')
  if (limpo.length === 11) return { valido: validarCPF(limpo), tipo: 'CPF', limpo }
  if (limpo.length === 14) return { valido: validarCNPJ(limpo), tipo: 'CNPJ', limpo }
  return { valido: false, tipo: null, limpo }
}

function validarCPF(cpf) {
  if (/^(\d)\1+$/.test(cpf)) return false
  let soma = 0
  for (let i = 0; i < 9; i++) soma += parseInt(cpf.charAt(i), 10) * (10 - i)
  let resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  if (resto !== parseInt(cpf.charAt(9), 10)) return false
  soma = 0
  for (let i = 0; i < 10; i++) soma += parseInt(cpf.charAt(i), 10) * (11 - i)
  resto = (soma * 10) % 11
  if (resto === 10 || resto === 11) resto = 0
  return resto === parseInt(cpf.charAt(10), 10)
}

function validarCNPJ(cnpj) {
  if (/^(\d)\1+$/.test(cnpj)) return false
  let tamanho = cnpj.length - 2
  let numeros = cnpj.substring(0, tamanho)
  const digitos = cnpj.substring(tamanho)
  let soma = 0
  let pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  if (resultado !== parseInt(digitos.charAt(0), 10)) return false
  tamanho++
  numeros = cnpj.substring(0, tamanho)
  soma = 0
  pos = tamanho - 7
  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i), 10) * pos--
    if (pos < 2) pos = 9
  }
  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11)
  return resultado === parseInt(digitos.charAt(1), 10)
}

export function validarCamposObrigatorios(dados, campos) {
  if (!dados || typeof dados !== 'object') return { valido: false, campoFaltando: campos[0] || null }
  for (const campo of campos) {
    const valor = dados[campo]
    if (valor === undefined || valor === null || String(valor).trim() === '') return { valido: false, campoFaltando: campo }
  }
  return { valido: true, campoFaltando: null }
}

export function sanitizarTexto(valor, maxLen = 255) {
  if (valor === null || valor === undefined) return ''
  return String(valor)
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .slice(0, maxLen)
}

export function normalizarTelefone(telefone) {
  return String(telefone ?? '').replace(/\D/g, '')
}

export function validarSlug(slug) {
  if (!slug || typeof slug !== 'string') return { valido: false, erro: 'Slug obrigatório' }
  const t = slug.trim()
  if (t.length < 2 || t.length > 100) return { valido: false, erro: '2-100 caracteres' }
  if (!/^[a-zA-Z0-9_-]+$/.test(t)) return { valido: false, erro: 'Apenas letras, números, hífens e underscores são permitidos' }
  if (t.startsWith('-') || t.endsWith('-')) return { valido: false, erro: 'Não pode iniciar ou terminar com hífen' }
  return { valido: true }
}

export function isUUIDValido(uuid) {
  return !!(uuid && typeof uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid.trim()))
}

export function sanitizarObjeto(obj, campos) {
  const result = {}
  for (const campo of campos) {
    if (Object.prototype.hasOwnProperty.call(obj, campo)) result[campo] = obj[campo]
  }
  return result
}

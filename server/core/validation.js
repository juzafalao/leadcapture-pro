// ============================================================
// CORE — Serviço de Validação
// Regras centralizadas para validar dados de entrada
// ============================================================

/**
 * Valida um endereço de e-mail
 * @param {string} email
 * @returns {boolean}
 */
export function isEmailValido(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/**
 * Valida um número de telefone (mínimo 10 dígitos, somente números)
 * @param {string} telefone - Pode conter caracteres de formatação
 * @returns {boolean}
 */
export function isTelefoneValido(telefone) {
  const soDigitos = String(telefone ?? '').replace(/\D/g, '')
  // BR local: 10-11 dígitos. Com DDI: até 13 (ex.: 55 + DDD + número).
  return soDigitos.length >= 10 && soDigitos.length <= 13
}

/**
 * Valida CPF (11 dígitos) ou CNPJ (14 dígitos)
 * @param {string} documento
 * @returns {{ valido: boolean, tipo: 'CPF' | 'CNPJ' | null, limpo: string }}
 */
export function validarDocumento(documento) {
  const limpo = String(documento ?? '').replace(/\D/g, '')

  if (limpo.length === 11) return { valido: validarCPF(limpo), tipo: 'CPF', limpo }
  if (limpo.length === 14) return { valido: validarCNPJ(limpo), tipo: 'CNPJ', limpo }

  return { valido: false, tipo: null, limpo }
}

/**
 * Retorna true quando CPF/CNPJ for válido
 * @param {string} documento
 * @returns {boolean}
 */
export function isCpfCnpjValido(documento) {
  return validarDocumento(documento).valido
}

/**
 * Valida campos obrigatórios em um objeto
 * @param {object} dados - Objeto com os dados a validar
 * @param {string[]} campos - Lista de campos obrigatórios
 * @returns {{ valido: boolean, campoFaltando: string | null }}
 */
export function validarCamposObrigatorios(dados, campos) {
  if (!dados || typeof dados !== 'object') {
    return { valido: false, campoFaltando: campos?.[0] || null }
  }

  for (const campo of campos) {
    const valor = dados[campo]

    if (
      valor === undefined ||
      valor === null ||
      (typeof valor === 'string' && valor.trim() === '')
    ) {
      return { valido: false, campoFaltando: campo }
    }
  }
  return { valido: true, campoFaltando: null }
}

/**
 * Sanitiza uma string de texto (trim + limite de tamanho)
 * @param {string} valor
 * @param {number} maxLen
 * @returns {string}
 */
export function sanitizarTexto(valor, maxLen = 255) {
  return String(valor ?? '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, maxLen)
}

/**
 * Sanitiza objetos recursivamente, removendo chaves inseguras
 * e sanitizando todos os valores textuais.
 * @param {unknown} valor
 * @returns {unknown}
 */
export function sanitizarObjeto(valor) {
  if (Array.isArray(valor)) {
    return valor.map(item => sanitizarObjeto(item))
  }

  if (valor && typeof valor === 'object') {
    const resultado = {}

    for (const [chave, item] of Object.entries(valor)) {
      if (['__proto__', 'constructor', 'prototype'].includes(chave)) continue
      const chaveSegura = sanitizarChaveObjeto(chave)
      if (!chaveSegura) continue
      resultado[chaveSegura] = sanitizarObjeto(item)
    }

    return resultado
  }

  if (typeof valor === 'string') {
    return sanitizarTexto(valor)
  }

  return valor
}

/**
 * Limpa e normaliza o número de telefone (somente dígitos)
 * @param {string} telefone
 * @returns {string}
 */
export function normalizarTelefone(telefone) {
  return String(telefone ?? '').replace(/\D/g, '')
}

/**
 * Valida slug com letras minúsculas, números e hífens
 * @param {string} slug
 * @returns {boolean}
 */
export function isSlugValido(slug) {
  return typeof slug === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug.trim())
}

/**
 * Valida UUID v1-v5
 * @param {string} uuid
 * @returns {boolean}
 */
export function isUUIDValido(uuid) {
  return typeof uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(uuid.trim())
}

function validarCPF(cpf) {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1+$/.test(cpf)) return false

  const digito = (base, fatorInicial) => {
    const total = base.split('').reduce((acc, n, idx) => acc + Number(n) * (fatorInicial - idx), 0)
    const resto = (total * 10) % 11
    return resto === 10 ? 0 : resto
  }

  const d1 = digito(cpf.slice(0, 9), 10)
  const d2 = digito(cpf.slice(0, 10), 11)

  return d1 === Number(cpf[9]) && d2 === Number(cpf[10])
}

function validarCNPJ(cnpj) {
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1+$/.test(cnpj)) return false

  const calcular = (base, pesos) => {
    const soma = base.split('').reduce((acc, n, idx) => acc + Number(n) * pesos[idx], 0)
    const resto = soma % 11
    return resto < 2 ? 0 : 11 - resto
  }

  const d1 = calcular(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])
  const d2 = calcular(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2])

  return d1 === Number(cnpj[12]) && d2 === Number(cnpj[13])
}

function sanitizarChaveObjeto(chave) {
  return String(chave ?? '')
    .replace(/[^\w.-]/g, '')
    .slice(0, 80)
}

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
  return soDigitos.length >= 10
}

/**
 * Valida CPF (11 dígitos) ou CNPJ (14 dígitos)
 * @param {string} documento
 * @returns {{ valido: boolean, tipo: 'CPF' | 'CNPJ' | null, limpo: string }}
 */
export function validarDocumento(documento) {
  const limpo = String(documento ?? '').replace(/\D/g, '')

  if (limpo.length === 11) return { valido: true, tipo: 'CPF',  limpo }
  if (limpo.length === 14) return { valido: true, tipo: 'CNPJ', limpo }

  return { valido: false, tipo: null, limpo }
}

/**
 * Valida campos obrigatórios em um objeto
 * @param {object} dados - Objeto com os dados a validar
 * @param {string[]} campos - Lista de campos obrigatórios
 * @returns {{ valido: boolean, campoFaltando: string | null }}
 */
export function validarCamposObrigatorios(dados, campos) {
  for (const campo of campos) {
    if (!dados[campo] || String(dados[campo]).trim() === '') {
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
  return String(valor ?? '').trim().slice(0, maxLen)
}

/**
 * Limpa e normaliza o número de telefone (somente dígitos)
 * @param {string} telefone
 * @returns {string}
 */
export function normalizarTelefone(telefone) {
  return String(telefone ?? '').replace(/\D/g, '')
}

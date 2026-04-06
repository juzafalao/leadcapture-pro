// ============================================================
// CORE — Retry com Backoff Exponencial
// Função utilitária reutilizável para tentativas com espera
// progressiva entre falhas.
// ============================================================

/**
 * Executa uma função assíncrona com retry e backoff exponencial.
 *
 * @param {() => Promise<*>} fn        - Função a executar
 * @param {object}           [opts]    - Opções
 * @param {number}           [opts.maxRetries=3]   - Tentativas totais
 * @param {number}           [opts.baseDelay=1000] - Delay base em ms
 * @param {string}           [opts.label='Retry']  - Rótulo para logs
 * @returns {Promise<*>} Resultado da função em caso de sucesso
 */
export async function retryWithBackoff(fn, opts = {}) {
  const { maxRetries = 3, baseDelay = 1000, label = 'Retry' } = opts

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn()
      if (attempt > 1) {
        console.log(`[${label}] ✅ Sucesso na tentativa ${attempt}/${maxRetries}`)
      }
      return result
    } catch (err) {
      console.warn(`[${label}] ❌ Tentativa ${attempt}/${maxRetries}: ${err.message}`)

      if (attempt === maxRetries) {
        console.error(`[${label}] ❌ Falha apos ${maxRetries} tentativas`)
        throw err
      }

      const delay = baseDelay * attempt
      console.log(`[${label}] ⏳ Aguardando ${delay}ms antes da proxima tentativa...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

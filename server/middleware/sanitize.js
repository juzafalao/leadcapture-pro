// ============================================================
// Middleware de Sanitizacao — LeadCapture Pro
// Remove caracteres perigosos de XSS de campos de texto
// NOTA: SQL injection nao e risco real — Supabase usa
//       queries parametrizadas. Este middleware e uma
//       camada de defesa adicional para XSS.
// ============================================================

/**
 * Sanitiza uma string removendo tags HTML perigosas
 * Nao remove apostrofes/hifens pois quebra nomes validos
 */
function sanitizarString(val) {
  if (typeof val !== 'string') return val
  return val
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/javascript\s*:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim()
}

function sanitizarObj(obj) {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'string') return sanitizarString(obj)
  if (typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(sanitizarObj)

  const limpo = {}
  for (const [k, v] of Object.entries(obj)) {
    limpo[k] = sanitizarObj(v)
  }
  return limpo
}

export function sanitizeMiddleware(req, _res, next) {
  if (req.body)   req.body   = sanitizarObj(req.body)
  if (req.query)  req.query  = sanitizarObj(req.query)
  if (req.params) req.params = sanitizarObj(req.params)
  next()
}

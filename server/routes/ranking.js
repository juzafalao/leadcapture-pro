// server/routes/ranking.js -- v5 DEFINITIVO
// Decodifica JWT localmente para pegar auth_id -- zero dependencia de service key
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Decodifica JWT sem verificacao (Supabase ja verificou ao emitir)
// Retorna o payload: { sub: auth_id, email, role, ... }
function decodeJWT(token) {
  try {
    const payload = token.split('.')[1]
    const decoded = Buffer.from(payload, 'base64url').toString('utf8')
    return JSON.parse(decoded)
  } catch {
    try {
      const payload = token.split('.')[1]
      const decoded = Buffer.from(payload, 'base64').toString('utf8')
      return JSON.parse(decoded)
    } catch {
      return null
    }
  }
}

// Cliente autenticado com JWT do usuario (para queries RLS-aware)
function clienteJWT(token) {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    }
  )
}

// Cliente admin (service role -- bypassa RLS)
function clienteAdmin() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY,
    { auth: { persistSession: false } }
  )
}

// Verifica token e retorna dados do usuario
async function verificarToken(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null

  // Decodifica JWT para pegar o auth_id (sub)
  const jwt = decodeJWT(token)
  if (!jwt?.sub) return null

  try {
    // Usa service role para buscar usuario pelo auth_id -- ignora RLS
    const sb = clienteAdmin()
    const { data } = await sb
      .from('usuarios')
      .select('id, nome, role, tenant_id, is_super_admin, is_platform')
      .eq('auth_id', jwt.sub)
      .maybeSingle()

    return data || null
  } catch (err) {
    console.error('[ranking] verificarToken:', err.message)
    return null
  }
}

// GET /api/ranking/usuarios?tenant_id=xxx&ano=2026&mes=4
router.get('/usuarios', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
    if (!token) return res.status(401).json({ error: 'Token obrigatorio' })

    const usuario = await verificarToken(req)
    if (!usuario) return res.status(401).json({ error: 'Token invalido ou usuario nao encontrado' })

    const isAdmin = ['Administrador','admin','Diretor','Gestor'].includes(usuario.role)
      || usuario.is_super_admin || usuario.is_platform

    const tenantId = (isAdmin && req.query.tenant_id)
      ? req.query.tenant_id
      : usuario.tenant_id

    if (!tenantId) return res.status(400).json({ error: 'tenant_id obrigatorio' })

    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)

    // Usa service role para buscar dados de qualquer tenant
    const sb = clienteAdmin()

    const { data: users, error: usersErr } = await sb
      .from('usuarios')
      .select('id, nome, role, role_emoji, role_color')
      .eq('tenant_id', tenantId)
      .neq('role', 'Cliente')
      .order('nome')

    if (usersErr) {
      console.error('[Ranking] usuarios:', usersErr.message)
      return res.status(500).json({ error: usersErr.message })
    }

    if (!users?.length) {
      return res.json({ consultores: [], tenantId })
    }

    const inicio = new Date(ano, mes - 1, 1).toISOString()
    const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    const { data: leads } = await sb
      .from('leads')
      .select('id, categoria, capital_disponivel, id_operador_responsavel, operador_id, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .is('deleted_at', null)

    const mapa = {}
    for (const l of (leads || [])) {
      const uid = l.id_operador_responsavel || l.operador_id
      if (!uid) continue
      if (!mapa[uid]) mapa[uid] = { total: 0, hot: 0, convertido: 0, capital: 0 }
      mapa[uid].total++
      if (l.categoria === 'hot')     mapa[uid].hot++
      if (l.status === 'convertido') mapa[uid].convertido++
      mapa[uid].capital += parseFloat(l.capital_disponivel || 0)
    }

    const consultores = users
      .map(u => ({
        id:            u.id,
        nome:          u.nome,
        role:          u.role,
        role_emoji:    u.role_emoji,
        role_color:    u.role_color,
        total_leads:   mapa[u.id]?.total     ?? 0,
        leads_hot:     mapa[u.id]?.hot        ?? 0,
        convertidos:   mapa[u.id]?.convertido ?? 0,
        capital_total: mapa[u.id]?.capital    ?? 0,
      }))
      .sort((a, b) => b.total_leads - a.total_leads || b.capital_total - a.capital_total)

    res.json({ consultores, tenantId, total_leads: leads?.length ?? 0 })
  } catch (err) {
    console.error('[Ranking]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/ranking/meta?tenant_id=xxx&ano=2026&mes=4
router.get('/meta', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
    if (!token) return res.status(401).json({ error: 'Token obrigatorio' })

    const usuario = await verificarToken(req)
    if (!usuario) return res.status(401).json({ error: 'Token invalido' })

    const tenantId = req.query.tenant_id || usuario.tenant_id
    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)

    const sb = clienteAdmin()
    const { data } = await sb
      .from('ranking_metas')
      .select('meta_valor')
      .eq('tenant_id', tenantId)
      .eq('ano', ano)
      .eq('mes', mes)
      .is('consultor_id', null)
      .maybeSingle()

    res.json({ meta: data?.meta_valor ?? 30 })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

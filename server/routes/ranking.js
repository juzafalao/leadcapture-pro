// server/routes/ranking.js -- v6 com debug endpoint
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

function decodeJWT(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    // Adiciona padding se necessario
    let b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch (e) {
    console.error('[ranking] decodeJWT erro:', e.message)
    return null
  }
}

function clienteAdmin() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
  return createClient(url, key, { auth: { persistSession: false } })
}

async function verificarToken(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null

  const jwt = decodeJWT(token)
  if (!jwt?.sub) {
    console.error('[ranking] JWT decode falhou ou sub ausente')
    return null
  }

  try {
    const sb = clienteAdmin()
    const { data, error } = await sb
      .from('usuarios')
      .select('id, nome, role, tenant_id, is_super_admin, is_platform')
      .eq('auth_id', jwt.sub)
      .maybeSingle()

    if (error) console.error('[ranking] query usuarios erro:', error.message)
    if (!data)  console.error('[ranking] usuario nao encontrado para auth_id:', jwt.sub)
    return data || null
  } catch (err) {
    console.error('[ranking] verificarToken excecao:', err.message)
    return null
  }
}

// DEBUG -- retorna info do token e usuario (remover em producao)
router.get('/debug', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return res.json({ erro: 'sem token' })

  const jwt = decodeJWT(token)
  const sb  = clienteAdmin()

  const urlKey  = process.env.SUPABASE_URL ? 'ok' : 'AUSENTE'
  const svcKey  = process.env.SUPABASE_SERVICE_KEY ? 'ok' : 'AUSENTE'
  const anonKey = process.env.SUPABASE_ANON_KEY ? 'ok' : 'AUSENTE'

  let usuario = null
  let erroQuery = null
  if (jwt?.sub) {
    const { data, error } = await sb
      .from('usuarios')
      .select('id, nome, role, tenant_id')
      .eq('auth_id', jwt.sub)
      .maybeSingle()
    usuario    = data
    erroQuery  = error?.message
  }

  res.json({
    jwt_sub:    jwt?.sub || null,
    jwt_email:  jwt?.email || null,
    jwt_exp:    jwt?.exp ? new Date(jwt.exp * 1000).toISOString() : null,
    env: { SUPABASE_URL: urlKey, SUPABASE_SERVICE_KEY: svcKey, SUPABASE_ANON_KEY: anonKey },
    usuario,
    erroQuery,
  })
})

// GET /api/ranking/usuarios
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

    const sb = clienteAdmin()

    const { data: users, error: usersErr } = await sb
      .from('usuarios')
      .select('id, nome, role, role_emoji, role_color')
      .eq('tenant_id', tenantId)
      .neq('role', 'Cliente')
      .order('nome')

    if (usersErr) return res.status(500).json({ error: usersErr.message })
    if (!users?.length) return res.json({ consultores: [], tenantId })

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

// GET /api/ranking/meta
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

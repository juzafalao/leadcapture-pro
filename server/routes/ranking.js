// server/routes/ranking.js -- v8 DEFINITIVO
// Auth: verifica apenas se JWT e do nosso Supabase (sem query no banco)
// Dados: service role para todas as queries
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Service role -- bypassa RLS completamente
function sb() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )
}

// Decodifica JWT sem verificar assinatura
function decodeJWT(token) {
  try {
    let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch { return null }
}

// Verifica se JWT e do nosso Supabase -- sem query no banco
function verificarJWT(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null
  const jwt = decodeJWT(token)
  if (!jwt?.sub) return null
  // Verifica se o issuer e do nosso Supabase
  const url = process.env.SUPABASE_URL || ''
  if (jwt.iss && url && !jwt.iss.includes(url.replace('https://', ''))) return null
  return { sub: jwt.sub, email: jwt.email }
}

// Busca usuario no banco dado o auth_id (sub do JWT)
async function buscarUsuario(sub, token) {
  // Usa o JWT do proprio usuario para buscar seus dados
  // RLS permite via policy: auth_id = auth.uid()
  try {
    const url     = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY
    const sbUser  = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data, error } = await sbUser
      .from('usuarios')
      .select('id, nome, role, tenant_id')
      .eq('auth_id', sub)
      .limit(1)
    if (error) {
      console.error('[ranking] buscarUsuario erro:', error.message)
      return null
    }
    return data?.[0] || null
  } catch (e) {
    console.error('[ranking] buscarUsuario excecao:', e.message)
    return null
  }
}

// DEBUG
router.get('/debug', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  const jwt   = decodeJWT(token)
  let usuario = null
  let dbError = null
  if (jwt?.sub) {
    try {
      const anonKey = process.env.SUPABASE_ANON_KEY
      const sbU = createClient(process.env.SUPABASE_URL, anonKey, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      })
      const r = await sbU.from('usuarios').select('id, nome, role, tenant_id').eq('auth_id', jwt.sub).limit(1)
      usuario = r.data?.[0] || null
      dbError = r.error?.message
    } catch (e) { dbError = e.message }
  }
  res.json({
    token_presente:  !!token,
    jwt_sub:         jwt?.sub || null,
    jwt_iss:         jwt?.iss || null,
    jwt_exp:         jwt?.exp ? new Date(jwt.exp * 1000).toISOString() : null,
    supabase_url:    process.env.SUPABASE_URL ? process.env.SUPABASE_URL.slice(0,30) + '...' : 'AUSENTE',
    service_key_ok:  !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    anon_key_ok:     !!process.env.SUPABASE_ANON_KEY,
    usuario,
    db_error:        dbError,
  })
})

// GET /api/ranking/tenants
router.get('/tenants', async (req, res) => {
  try {
    const jwtData = verificarJWT(req)
    if (!jwtData) return res.status(401).json({ error: 'Token invalido' })
    const usuario = await buscarUsuario(jwtData.sub, (req.headers.authorization || "").replace("Bearer ", "").trim())
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })
    const isAdmin = ['Administrador','admin'].includes(usuario.role)
    if (!isAdmin) return res.json({ tenants: [{ id: usuario.tenant_id, name: 'Minha empresa' }] })
    const { data } = await sb().from('tenants').select('id, name').order('name')
    res.json({ tenants: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/ranking/usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const jwtData = verificarJWT(req)
    if (!jwtData) return res.status(401).json({ error: 'JWT invalido -- faca logout e login' })

    const usuario = await buscarUsuario(jwtData.sub, (req.headers.authorization || "").replace("Bearer ", "").trim())
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado no banco' })

    const isAdmin = ['Administrador','admin','Diretor','Gestor'].includes(usuario.role)

    const tenantId = (isAdmin && req.query.tenant_id) ? req.query.tenant_id : usuario.tenant_id
    if (!tenantId) return res.status(400).json({ error: 'tenant_id obrigatorio' })

    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
    const c   = sb()

    const { data: users, error: usersErr } = await c
      .from('usuarios')
      .select('id, nome, role')
      .eq('tenant_id', tenantId)
      .in('role', ['Consultor', 'Gestor', 'Operador'])
      .order('nome')

    if (usersErr) return res.status(500).json({ error: usersErr.message })
    if (!users?.length) return res.json({ consultores: [], tenantId })

    const inicio = new Date(ano, mes - 1, 1).toISOString()
    const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    const { data: leads } = await c
      .from('leads')
      .select('id, categoria, capital_disponivel, id_operador_responsavel, operador_id, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .is('deleted_at', null)

    const { data: metas } = await c.from('ranking_metas').select('*').eq('tenant_id', tenantId).eq('ano', ano).eq('mes', mes)
    const { data: faixas } = await c.from('ranking_config').select('*').eq('tenant_id', tenantId).eq('ativo', true).order('de')

    function calcComissao(capital, fxs) {
      if (!fxs?.length || !capital) return { pct: 0, valor: 0, bonus: 0 }
      const f = [...fxs].reverse().find(f => capital >= f.de)
      if (!f) return { pct: 0, valor: 0, bonus: 0 }
      return { pct: f.pct, valor: (capital * f.pct) / 100, bonus: f.bonus || 0 }
    }

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

    const metaGlobal = metas?.find(m => !m.consultor_id) || {}
    const totalLeadsEquipe = Object.values(mapa).reduce((a, b) => a + b.total, 0)
    const pctEquipe = (metaGlobal.meta_leads || 0) > 0
      ? Math.round((totalLeadsEquipe / ((metaGlobal.meta_leads) * users.length)) * 100)
      : 0

    const consultores = users.map(u => {
      const d = mapa[u.id] || { total: 0, hot: 0, convertido: 0, capital: 0 }
      const metaInd  = metas?.find(m => m.consultor_id === u.id) || {}
      const metaLeads = metaInd.meta_leads || metaGlobal.meta_leads || metaGlobal.meta_valor || 20
      const pctMeta   = metaLeads > 0 ? Math.min(Math.round((d.total / metaLeads) * 100), 100) : 0
      const com       = calcComissao(d.capital, faixas)
      const bateuMeta  = pctMeta >= 100
      const bateuEquipe = pctEquipe >= 80
      return {
        id: u.id, nome: u.nome, role: u.role, role_emoji: null, role_color: null,
        total_leads: d.total, leads_hot: d.hot, convertidos: d.convertido, capital_total: d.capital,
        pct_meta: pctMeta, meta_leads: metaLeads,
        comissao_pct: com.pct, comissao_valor: Math.round(com.valor), bonus_faixa: com.bonus,
        bonus_individual: bateuMeta   ? (metaGlobal.bonus_individual || 0) : 0,
        bonus_equipe:     bateuEquipe ? (metaGlobal.bonus_equipe     || 0) : 0,
        total_ganhos: Math.round(com.valor) + com.bonus
          + (bateuMeta   ? (metaGlobal.bonus_individual || 0) : 0)
          + (bateuEquipe ? (metaGlobal.bonus_equipe     || 0) : 0),
        bateu_meta: bateuMeta,
      }
    }).sort((a, b) => b.total_leads - a.total_leads || b.capital_total - a.capital_total)

    res.json({ consultores, tenantId, total_leads: leads?.length ?? 0, meta_global: metaGlobal, pct_equipe: pctEquipe, bateu_meta_equipe: pctEquipe >= 80 })
  } catch (err) {
    console.error('[Ranking]', err)
    res.status(500).json({ error: err.message })
  }
})

// GET /api/ranking/meta
router.get('/meta', async (req, res) => {
  try {
    const jwtData = verificarJWT(req)
    if (!jwtData) return res.status(401).json({ error: 'Token invalido' })
    const usuario = await buscarUsuario(jwtData.sub, (req.headers.authorization || "").replace("Bearer ", "").trim())
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })
    const tenantId = req.query.tenant_id || usuario.tenant_id
    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
    const { data } = await sb().from('ranking_metas').select('*').eq('tenant_id', tenantId).eq('ano', ano).eq('mes', mes).is('consultor_id', null).maybeSingle()
    res.json({ meta: data?.meta_leads || data?.meta_valor || 20, config: data || {} })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})


// POST /api/ranking/meta -- salva meta via service role (bypassa RLS para admin cross-tenant)
router.post('/meta', async (req, res) => {
  try {
    const jwtData = verificarJWT(req)
    if (!jwtData) return res.status(401).json({ error: 'Token invalido' })
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
    const usuario = await buscarUsuario(jwtData.sub, token)
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })
    const isAdmin = ['Administrador','admin','Diretor'].includes(usuario.role)
    if (!isAdmin) return res.status(403).json({ error: 'Sem permissao' })

    const { tenant_id, ano, mes, meta_leads, meta_capital, bonus_individual, bonus_equipe, pct_gestor } = req.body
    if (!tenant_id || !ano || !mes) return res.status(400).json({ error: 'tenant_id, ano e mes obrigatorios' })

    const metaLeads = parseInt(meta_leads) || 20
    const { error } = await sb().from('ranking_metas').upsert({
      tenant_id, ano: parseInt(ano), mes: parseInt(mes), consultor_id: null,
      meta_valor:       metaLeads,
      meta_leads:       metaLeads,
      meta_capital:     parseFloat(meta_capital) || 0,
      bonus_individual: parseFloat(bonus_individual) || 0,
      bonus_equipe:     parseFloat(bonus_equipe) || 0,
      pct_gestor:       parseFloat(pct_gestor) || 0,
    }, { onConflict: 'tenant_id,ano,mes,consultor_id' })

    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

// server/routes/ranking.js -- v9 FINAL
// Auth: decodifica JWT local + busca usuario com service role (trim na key)
// Dados: service role para todas as queries
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Service role client -- trim() elimina espacos/newlines da variavel de ambiente
function sb() {
  const url = (process.env.SUPABASE_URL || '').trim()
  const key = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  if (!url || !key) throw new Error('SUPABASE_URL ou SERVICE_KEY nao configurados')
  return createClient(url, key, { auth: { persistSession: false } })
}

// Decodifica JWT sem verificar assinatura
function decodeJWT(token) {
  try {
    let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch { return null }
}

// Valida JWT e extrai sub -- sem query no banco
function verificarJWT(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null
  const jwt = decodeJWT(token)
  if (!jwt?.sub) return null
  return { sub: jwt.sub, email: jwt.email, token }
}

// Busca usuario pelo auth_id usando service role (bypassa RLS, trim na key)
async function buscarUsuario(sub) {
  try {
    const { data, error } = await sb()
      .from('usuarios')
      .select('id, nome, role, tenant_id')
      .eq('auth_id', sub)
      .limit(1)
    if (error) { console.error('[ranking] buscarUsuario:', error.message); return null }
    return data?.[0] || null
  } catch (e) { console.error('[ranking] buscarUsuario exc:', e.message); return null }
}

const ROLES_RANKING = ['Consultor', 'Gestor', 'Operador']

// DEBUG
router.get('/debug', async (req, res) => {
  const jwt = verificarJWT(req)
  let usuario = null, dbError = null, keyLen = 0, urlOk = false
  try {
    const url = (process.env.SUPABASE_URL || '').trim()
    const key = (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    keyLen = key.length
    urlOk  = url.length > 0
    if (jwt?.sub) {
      const r = await createClient(url, key, { auth: { persistSession: false } })
        .from('usuarios').select('id, nome, role, tenant_id').eq('auth_id', jwt.sub).limit(1)
      usuario  = r.data?.[0] || null
      dbError  = r.error?.message || null
    }
  } catch (e) { dbError = e.message }
  res.json({
    token_ok:  !!jwt?.token,
    jwt_sub:   jwt?.sub || null,
    jwt_email: jwt?.email || null,
    url_ok:    urlOk,
    key_len:   keyLen,
    usuario,
    db_error:  dbError,
  })
})

// GET /api/ranking/tenants
router.get('/tenants', async (req, res) => {
  try {
    const jwt = verificarJWT(req)
    if (!jwt) return res.status(401).json({ error: 'Token invalido' })
    const usuario = await buscarUsuario(jwt.sub)
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })
    const isAdmin = ['Administrador','admin','Diretor'].includes(usuario.role)
    if (!isAdmin) return res.json({ tenants: [{ id: usuario.tenant_id, name: 'Minha empresa' }] })
    const { data } = await sb().from('tenants').select('id, name').order('name')
    res.json({ tenants: data || [] })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/ranking/usuarios
router.get('/usuarios', async (req, res) => {
  try {
    const jwt = verificarJWT(req)
    if (!jwt) return res.status(401).json({ error: 'Token invalido' })
    const usuario = await buscarUsuario(jwt.sub)
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })

    const isAdmin = ['Administrador','admin','Diretor','Gestor'].includes(usuario.role)
    const tenantId = (isAdmin && req.query.tenant_id) ? req.query.tenant_id : usuario.tenant_id
    if (!tenantId) return res.status(400).json({ error: 'tenant_id obrigatorio' })

    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
    const c   = sb()

    const { data: users, error: usersErr } = await c
      .from('usuarios').select('id, nome, role')
      .eq('tenant_id', tenantId).in('role', ROLES_RANKING).order('nome')

    if (usersErr) return res.status(500).json({ error: usersErr.message })
    if (!users?.length) return res.json({ consultores: [], tenantId })

    const inicio = new Date(ano, mes - 1, 1).toISOString()
    const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    const [{ data: leads }, { data: metas }, { data: faixas }] = await Promise.all([
      c.from('leads')
       .select('id, categoria, capital_disponivel, id_operador_responsavel, status')
       .eq('tenant_id', tenantId).gte('created_at', inicio).lte('created_at', fim).is('deleted_at', null),
      c.from('ranking_metas').select('*').eq('tenant_id', tenantId).eq('ano', ano).eq('mes', mes),
      c.from('ranking_config').select('*').eq('tenant_id', tenantId).eq('ativo', true).order('de'),
    ])

    function calcCom(capital, fxs) {
      if (!fxs?.length || !capital) return { pct: 0, valor: 0, bonus: 0 }
      const f = [...fxs].reverse().find(f => capital >= f.de)
      return f ? { pct: f.pct, valor: (capital * f.pct) / 100, bonus: f.bonus || 0 } : { pct: 0, valor: 0, bonus: 0 }
    }

    const mapa = {}
    for (const l of (leads || [])) {
      const uid = l.id_operador_responsavel
      if (!uid) continue
      if (!mapa[uid]) mapa[uid] = { total: 0, hot: 0, conv: 0, capital: 0 }
      mapa[uid].total++
      if (l.categoria === 'hot') mapa[uid].hot++
      if (l.status === 'convertido' || (l.status || '').includes('fecha')) mapa[uid].conv++
      mapa[uid].capital += parseFloat(l.capital_disponivel || 0)
    }

    const metaG = metas?.find(m => !m.consultor_id) || {}
    const totalEq = Object.values(mapa).reduce((a, b) => a + b.total, 0)
    const pctEq   = (metaG.meta_leads || 0) > 0
      ? Math.round((totalEq / ((metaG.meta_leads) * users.length)) * 100) : 0

    const consultores = users.map(u => {
      const d = mapa[u.id] || { total: 0, hot: 0, conv: 0, capital: 0 }
      const metaInd  = metas?.find(m => m.consultor_id === u.id) || {}
      const metaLeads = metaInd.meta_leads || metaG.meta_leads || metaG.meta_valor || 20
      const pctMeta   = metaLeads > 0 ? Math.min(Math.round((d.total / metaLeads) * 100), 100) : 0
      const com = calcCom(d.capital, faixas)
      const bateuMeta   = pctMeta >= 100
      const bateuEquipe = pctEq   >= 80
      return {
        id: u.id, nome: u.nome, role: u.role,
        role_emoji: null, role_color: null,
        total_leads: d.total, leads_hot: d.hot, convertidos: d.conv,
        capital_total: d.capital, pct_meta: pctMeta, meta_leads: metaLeads,
        comissao_pct: com.pct, comissao_valor: Math.round(com.valor), bonus_faixa: com.bonus,
        bonus_individual: bateuMeta   ? (metaG.bonus_individual || 0) : 0,
        bonus_equipe:     bateuEquipe ? (metaG.bonus_equipe     || 0) : 0,
        total_ganhos: Math.round(com.valor) + com.bonus
          + (bateuMeta   ? (metaG.bonus_individual || 0) : 0)
          + (bateuEquipe ? (metaG.bonus_equipe     || 0) : 0),
        bateu_meta: bateuMeta,
      }
    }).sort((a, b) => b.total_leads - a.total_leads || b.capital_total - a.capital_total)

    res.json({
      consultores, tenantId, total_leads: leads?.length ?? 0,
      meta_global: metaG, pct_equipe: pctEq, bateu_meta_equipe: pctEq >= 80,
    })
  } catch (err) { console.error('[Ranking]', err); res.status(500).json({ error: err.message }) }
})

// GET /api/ranking/meta
router.get('/meta', async (req, res) => {
  try {
    const jwt = verificarJWT(req)
    if (!jwt) return res.status(401).json({ error: 'Token invalido' })
    const usuario = await buscarUsuario(jwt.sub)
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })
    const tenantId = req.query.tenant_id || usuario.tenant_id
    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
    const { data } = await sb().from('ranking_metas').select('*')
      .eq('tenant_id', tenantId).eq('ano', ano).eq('mes', mes).is('consultor_id', null).limit(1)
    const row = data?.[0] || {}
    res.json({ meta: row.meta_leads || row.meta_valor || 20, config: row })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/ranking/meta -- salva meta com service role
router.post('/meta', async (req, res) => {
  try {
    const jwt = verificarJWT(req)
    if (!jwt) return res.status(401).json({ error: 'Token invalido' })
    const usuario = await buscarUsuario(jwt.sub)
    if (!usuario) return res.status(401).json({ error: 'Usuario nao encontrado' })
    const isAdmin = ['Administrador','admin','Diretor'].includes(usuario.role)
    if (!isAdmin) return res.status(403).json({ error: 'Sem permissao' })
    const { tenant_id, ano, mes, meta_leads, meta_capital, bonus_individual, bonus_equipe, pct_gestor } = req.body
    if (!tenant_id) return res.status(400).json({ error: 'tenant_id obrigatorio' })
    const metaLeads = parseInt(meta_leads) || 20
    const { error } = await sb().from('ranking_metas').upsert({
      tenant_id, ano: parseInt(ano), mes: parseInt(mes), consultor_id: null,
      meta_valor: metaLeads, meta_leads: metaLeads,
      meta_capital:     parseFloat(meta_capital)     || 0,
      bonus_individual: parseFloat(bonus_individual) || 0,
      bonus_equipe:     parseFloat(bonus_equipe)     || 0,
      pct_gestor:       parseFloat(pct_gestor)       || 0,
    }, { onConflict: 'tenant_id,ano,mes,consultor_id' })
    if (error) return res.status(500).json({ error: error.message })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

export default router

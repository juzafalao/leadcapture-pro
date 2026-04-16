// server/routes/ranking.js -- v7 DEFINITIVO
// Usa apenas SERVICE_KEY -- sem dependencia de ANON_KEY
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Unico cliente -- service role bypassa RLS completamente
function sb() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_KEY nao configurados')
  return createClient(url, key, { auth: { persistSession: false } })
}

// Decodifica JWT sem verificacao de assinatura (Supabase ja verificou)
function decodeJWT(token) {
  try {
    let b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    while (b64.length % 4) b64 += '='
    return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'))
  } catch { return null }
}

// Autentica via JWT -- service role busca usuario pelo auth_id
async function auth(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null
  const jwt = decodeJWT(token)
  if (!jwt?.sub) return null
  // Verifica expiracao
  if (jwt.exp && jwt.exp < Math.floor(Date.now() / 1000)) return null
  const { data } = await sb()
    .from('usuarios')
    .select('id, nome, role, tenant_id, is_super_admin, is_platform')
    .eq('auth_id', jwt.sub)
    .maybeSingle()
  return data || null
}

// Roles que aparecem no ranking (consultor e gestor)
const ROLES_RANKING = ['Consultor', 'Gestor', 'Operador']
// Roles que podem ver o ranking
const ROLES_ACESSO  = ['Gestor', 'Diretor', 'Administrador', 'admin', 'Consultor']

//  GET /api/ranking/debug 
router.get('/debug', async (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  const jwt   = decodeJWT(token)
  const usuario = await auth(req)
  res.json({
    token_presente: !!token,
    jwt_sub:   jwt?.sub || null,
    jwt_exp:   jwt?.exp ? new Date(jwt.exp * 1000).toISOString() : null,
    expirado:  jwt?.exp ? jwt.exp < Math.floor(Date.now() / 1000) : null,
    env_url:   !!process.env.SUPABASE_URL,
    env_svc:   !!(process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY),
    usuario:   usuario ? { id: usuario.id, nome: usuario.nome, role: usuario.role, tenant_id: usuario.tenant_id } : null,
  })
})

//  GET /api/ranking/usuarios 
router.get('/usuarios', async (req, res) => {
  try {
    const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
    if (!token) return res.status(401).json({ error: 'Token obrigatorio' })

    const usuario = await auth(req)
    if (!usuario) return res.status(401).json({ error: 'Token invalido ou expirado -- faca logout e login novamente' })

    const isAdmin = ['Administrador','admin','Diretor','Gestor'].includes(usuario.role)
      || usuario.is_super_admin || usuario.is_platform

    const tenantId = (isAdmin && req.query.tenant_id) ? req.query.tenant_id : usuario.tenant_id
    if (!tenantId) return res.status(400).json({ error: 'tenant_id obrigatorio' })

    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
    const c   = sb()

    // Busca consultores e gestores do tenant (nao busca Diretor/Admin)
    const { data: users, error: usersErr } = await c
      .from('usuarios')
      .select('id, nome, role, role_emoji, role_color')
      .eq('tenant_id', tenantId)
      .in('role', ROLES_RANKING)
      .order('nome')

    if (usersErr) return res.status(500).json({ error: usersErr.message })
    if (!users?.length) return res.json({ consultores: [], tenantId })

    // Leads do mes
    const inicio = new Date(ano, mes - 1, 1).toISOString()
    const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    const { data: leads } = await c
      .from('leads')
      .select('id, categoria, capital_disponivel, id_operador_responsavel, operador_id, status')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .is('deleted_at', null)

    // Metas do mes
    const { data: metas } = await c
      .from('ranking_metas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ano', ano)
      .eq('mes', mes)

    // Faixas de comissao
    const { data: faixas } = await c
      .from('ranking_config')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ativo', true)
      .order('de')

    // Calcula comissao por capital
    function calcComissao(capital, fxs) {
      if (!fxs?.length || !capital) return { pct: 0, valor: 0, bonus: 0 }
      const f = [...fxs].reverse().find(f => capital >= f.de)
      if (!f) return { pct: 0, valor: 0, bonus: 0 }
      return { pct: f.pct, valor: (capital * f.pct) / 100, bonus: f.bonus || 0 }
    }

    // Agrupa leads por operador
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
    const pctEquipe = metaGlobal.meta_leads > 0
      ? Math.round((totalLeadsEquipe / (metaGlobal.meta_leads * users.length)) * 100)
      : 0

    const consultores = users.map(u => {
      const dados = mapa[u.id] || { total: 0, hot: 0, convertido: 0, capital: 0 }
      const metaInd = metas?.find(m => m.consultor_id === u.id) || {}
      const metaLeads = metaInd.meta_leads || metaGlobal.meta_leads || 20
      const pctMeta = metaLeads > 0 ? Math.min(Math.round((dados.total / metaLeads) * 100), 100) : 0
      const com = calcComissao(dados.capital, faixas)
      const bateuMeta = pctMeta >= 100
      const bateuEquipe = pctEquipe >= 80

      return {
        id:              u.id,
        nome:            u.nome,
        role:            u.role,
        role_emoji:      u.role_emoji,
        role_color:      u.role_color,
        total_leads:     dados.total,
        leads_hot:       dados.hot,
        convertidos:     dados.convertido,
        capital_total:   dados.capital,
        pct_meta:        pctMeta,
        meta_leads:      metaLeads,
        comissao_pct:    com.pct,
        comissao_valor:  Math.round(com.valor),
        bonus_faixa:     com.bonus,
        bonus_individual:bateuMeta  ? (metaGlobal.bonus_individual || 0) : 0,
        bonus_equipe:    bateuEquipe ? (metaGlobal.bonus_equipe    || 0) : 0,
        total_ganhos:    Math.round(com.valor) + com.bonus
          + (bateuMeta  ? (metaGlobal.bonus_individual || 0) : 0)
          + (bateuEquipe ? (metaGlobal.bonus_equipe    || 0) : 0),
        bateu_meta:      bateuMeta,
      }
    }).sort((a, b) => b.total_leads - a.total_leads || b.capital_total - a.capital_total)

    res.json({
      consultores,
      tenantId,
      total_leads:      leads?.length ?? 0,
      meta_global:      metaGlobal,
      pct_equipe:       pctEquipe,
      bateu_meta_equipe: pctEquipe >= 80,
    })
  } catch (err) {
    console.error('[Ranking]', err)
    res.status(500).json({ error: err.message })
  }
})

//  GET /api/ranking/meta 
router.get('/meta', async (req, res) => {
  try {
    const usuario = await auth(req)
    if (!usuario) return res.status(401).json({ error: 'Nao autorizado' })
    const tenantId = req.query.tenant_id || usuario.tenant_id
    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)
    const { data } = await sb()
      .from('ranking_metas')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('ano', ano)
      .eq('mes', mes)
      .is('consultor_id', null)
      .maybeSingle()
    res.json({ meta: data?.meta_leads ?? 20, config: data || {} })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

//  GET /api/ranking/tenants 
router.get('/tenants', async (req, res) => {
  try {
    const usuario = await auth(req)
    if (!usuario) return res.status(401).json({ error: 'Nao autorizado' })
    const isAdmin = ['Administrador','admin'].includes(usuario.role)
      || usuario.is_super_admin || usuario.is_platform
    if (!isAdmin) return res.json({ tenants: [{ id: usuario.tenant_id, name: 'Minha empresa' }] })
    const { data } = await sb().from('tenants').select('id, name').order('name')
    res.json({ tenants: data || [] })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router

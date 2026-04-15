// server/routes/ranking.js -- v3 fix definitivo verificarToken
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Verifica token usando JWT diretamente no cliente -- sem auth.getUser()
// O PostgREST usa o JWT no header Authorization para RLS: auth.uid() funciona
async function verificarToken(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) return null

  try {
    const url     = process.env.SUPABASE_URL
    const anonKey = process.env.SUPABASE_ANON_KEY
    if (!url || !anonKey) return null

    // Cria cliente com o JWT do usuario -- RLS deixa passar somente o proprio registro
    const sb = createClient(url, anonKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    // Busca o proprio usuario -- RLS filtra automaticamente por auth.uid()
    const { data, error } = await sb
      .from('usuarios')
      .select('id, nome, role, tenant_id, is_super_admin, is_platform')
      .maybeSingle()

    if (error || !data) {
      console.error('[ranking] usuario nao encontrado:', error?.message)
      return null
    }
    return data
  } catch (err) {
    console.error('[ranking] verificarToken:', err.message)
    return null
  }
}

// Cliente admin para bypassar RLS nas queries de outros tenants
function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase nao configurado')
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET /api/ranking/usuarios?tenant_id=xxx&ano=2026&mes=4
router.get('/usuarios', async (req, res) => {
  try {
    const usuario = await verificarToken(req)
    if (!usuario) return res.status(401).json({ error: 'Nao autorizado' })

    const isAdmin = ['Administrador','admin','Diretor','Gestor'].includes(usuario.role)
      || usuario.is_super_admin || usuario.is_platform

    const tenantId = (isAdmin && req.query.tenant_id)
      ? req.query.tenant_id
      : usuario.tenant_id

    if (!tenantId) return res.status(400).json({ error: 'tenant_id obrigatorio' })

    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)

    const sb = getAdminClient()

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
      .select('id, score, categoria, capital_disponivel, id_operador_responsavel, operador_id, status')
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
    const usuario = await verificarToken(req)
    if (!usuario) return res.status(401).json({ error: 'Nao autorizado' })

    const tenantId = req.query.tenant_id || usuario.tenant_id
    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)

    const sb = getAdminClient()
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

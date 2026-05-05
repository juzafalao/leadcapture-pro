// ============================================================
// ROUTES — /api/vendas
// Gestão de vendas (taxa de franquia negociada por lead)
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'

const router = Router()

async function autenticar(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) throw new Error('Token ausente')
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) throw new Error('Token inválido')
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id, role')
    .eq('auth_id', data.user.id)
    .single()
  if (!usuario) throw new Error('Usuário não encontrado')
  return usuario
}

function isGestor(role) {
  return ['Gestor', 'Diretor', 'Administrador', 'admin'].includes(role)
}

// ─────────────────────────────────────────────
// GET /api/vendas
// Lista vendas do tenant (com filtros opcionais)
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { ano, mes, consultor_id, marca_id } = req.query
    const tenantIdParam = req.query.tenant_id
    const tenantFiltro = (['Administrador', 'admin'].includes(usuario.role) && tenantIdParam)
      ? tenantIdParam : usuario.tenant_id

    let q = supabase
      .from('vendas')
      .select(`
        id, taxa_franquia_tabela, taxa_franquia_negociada, data_venda,
        status, observacoes, created_at,
        lead:lead_id(id, nome, email, telefone, categoria),
        marca:marca_id(id, nome, emoji),
        consultor:consultor_id(id, nome, role)
      `)
      .eq('tenant_id', tenantFiltro)
      .order('data_venda', { ascending: false })

    if (ano && mes) {
      const ini = `${ano}-${String(mes).padStart(2,'0')}-01`
      const fim = new Date(Number(ano), Number(mes), 1).toISOString().slice(0,10)
      q = q.gte('data_venda', ini).lt('data_venda', fim)
    }
    if (consultor_id) q = q.eq('consultor_id', consultor_id)
    if (marca_id)     q = q.eq('marca_id', marca_id)

    const { data, error } = await q
    if (error) throw error
    res.json({ success: true, vendas: data || [] })
  } catch (err) {
    res.status(401).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/vendas/resumo
// KPIs de receita para dashboard
// ─────────────────────────────────────────────
router.get('/resumo', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { ano, mes } = req.query
    const tenantIdParam = req.query.tenant_id
    const tenantFiltro = (['Administrador', 'admin'].includes(usuario.role) && tenantIdParam)
      ? tenantIdParam : usuario.tenant_id

    const now = new Date()
    const anoQ = Number(ano || now.getFullYear())
    const mesQ = Number(mes || now.getMonth() + 1)
    const ini  = `${anoQ}-${String(mesQ).padStart(2,'0')}-01`
    const fim  = new Date(anoQ, mesQ, 1).toISOString().slice(0,10)

    const { data, error } = await supabase
      .from('vendas')
      .select('taxa_franquia_negociada, consultor_id, marca_id, data_venda')
      .eq('tenant_id', tenantFiltro)
      .eq('status', 'confirmada')
      .gte('data_venda', ini)
      .lt('data_venda', fim)

    if (error) throw error

    const vendas = data || []
    const receita_total = vendas.reduce((a, v) => a + parseFloat(v.taxa_franquia_negociada || 0), 0)
    const ticket_medio  = vendas.length > 0 ? receita_total / vendas.length : 0
    const total_vendas  = vendas.length

    res.json({ success: true, resumo: { receita_total, ticket_medio, total_vendas } })
  } catch (err) {
    res.status(401).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────
// GET /api/vendas/por-lead/:leadId
// Busca venda vinculada a um lead específico
// ─────────────────────────────────────────────
router.get('/por-lead/:leadId', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { data, error } = await supabase
      .from('vendas')
      .select('*, marca:marca_id(id, nome, taxa_franquia_padrao, taxa_franquia_minima)')
      .eq('lead_id', req.params.leadId)
      .eq('tenant_id', usuario.tenant_id)
      .maybeSingle()

    if (error) throw error
    res.json({ success: true, venda: data })
  } catch (err) {
    res.status(401).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────
// POST /api/vendas
// Registra nova venda
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { lead_id, taxa_franquia_negociada, taxa_franquia_tabela,
            data_venda, observacoes, marca_id, consultor_id } = req.body

    if (!lead_id)                    return res.status(400).json({ success: false, error: 'lead_id obrigatório' })
    if (!taxa_franquia_negociada)    return res.status(400).json({ success: false, error: 'taxa_franquia_negociada obrigatória' })

    const { data, error } = await supabase
      .from('vendas')
      .upsert({
        tenant_id: usuario.tenant_id,
        lead_id,
        marca_id:                marca_id               || null,
        consultor_id:            consultor_id           || null,
        taxa_franquia_tabela:    taxa_franquia_tabela   || null,
        taxa_franquia_negociada: Number(taxa_franquia_negociada),
        data_venda:              data_venda             || new Date().toISOString().slice(0,10),
        status:                  'confirmada',
        observacoes:             observacoes            || null,
      }, { onConflict: 'lead_id' })
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, venda: data })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
})

// ─────────────────────────────────────────────
// PUT /api/vendas/:id
// Atualiza venda (somente gestores)
// ─────────────────────────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    if (!isGestor(usuario.role)) return res.status(403).json({ success: false, error: 'Acesso negado' })

    const { taxa_franquia_negociada, taxa_franquia_tabela, data_venda,
            observacoes, status } = req.body

    const { data, error } = await supabase
      .from('vendas')
      .update({
        ...(taxa_franquia_negociada !== undefined && { taxa_franquia_negociada: Number(taxa_franquia_negociada) }),
        ...(taxa_franquia_tabela    !== undefined && { taxa_franquia_tabela:    Number(taxa_franquia_tabela) }),
        ...(data_venda  && { data_venda }),
        ...(observacoes !== undefined && { observacoes }),
        ...(status      && { status }),
      })
      .eq('id', req.params.id)
      .eq('tenant_id', usuario.tenant_id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, venda: data })
  } catch (err) {
    res.status(400).json({ success: false, error: err.message })
  }
})

export default router

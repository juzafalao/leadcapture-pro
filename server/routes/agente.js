// ============================================================
// ROUTES — /api/agente
// Gerenciamento de configuração do Agente IA por tenant
// Acesso: super_admin pode gerenciar todos os tenants
//         admin do tenant pode gerenciar apenas o próprio
// LeadCapture Pro · Zafalão Tech
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { invalidarCacheAgente } from '../services/agente.js'

const router = Router()

const ADMIN_TENANT_ID = process.env.ADMIN_TENANT_ID || 'ac8a8add-3044-4051-a5e6-274b20da5633'

// Middleware de autenticação reutilizável
async function autenticar(req, res) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) { res.status(401).json({ success: false, error: 'Token obrigatório' }); return null }
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) { res.status(401).json({ success: false, error: 'Token inválido' }); return null }
  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, tenant_id, role, is_super_admin, is_platform')
    .eq('auth_id', user.id)
    .maybeSingle()
  if (!usuario) { res.status(403).json({ success: false, error: 'Usuário não encontrado' }); return null }
  return usuario
}

function isSuperAdmin(usuario) {
  return !!(usuario.is_super_admin || usuario.is_platform || usuario.tenant_id === ADMIN_TENANT_ID)
}

// ============================================================
// GET /api/agente/config?tenant_id=xxx
// Admin vê config do próprio tenant; super_admin pode ver qualquer tenant
// ============================================================
router.get('/config', async (req, res) => {
  const usuario = await autenticar(req, res)
  if (!usuario) return

  const superAdmin = isSuperAdmin(usuario)
  const targetTenantId = superAdmin && req.query.tenant_id
    ? req.query.tenant_id
    : usuario.tenant_id

  if (!targetTenantId) return res.status(400).json({ success: false, error: 'tenant_id obrigatório' })

  const { data, error } = await supabase
    .from('agente_configs')
    .select('*')
    .eq('tenant_id', targetTenantId)
    .maybeSingle()

  if (error) return res.status(500).json({ success: false, error: error.message })

  res.json({ success: true, config: data || null, isSuperAdmin: superAdmin })
})

// ============================================================
// PUT /api/agente/config
// Cria ou atualiza configuração do agente para um tenant
// ============================================================
router.put('/config', async (req, res) => {
  const usuario = await autenticar(req, res)
  if (!usuario) return

  const superAdmin = isSuperAdmin(usuario)
  const podeEditar = superAdmin || ['Administrador', 'Diretor'].includes(usuario.role)
  if (!podeEditar) return res.status(403).json({ success: false, error: 'Sem permissão' })

  const targetTenantId = superAdmin && req.body.tenant_id
    ? req.body.tenant_id
    : usuario.tenant_id

  if (!targetTenantId) return res.status(400).json({ success: false, error: 'tenant_id obrigatório' })

  const { habilitado, nome_agente, segmento, pitch_principal, capital_minimo, max_turns, prompt_extra } = req.body

  const { data, error } = await supabase
    .from('agente_configs')
    .upsert({
      tenant_id:       targetTenantId,
      habilitado:      habilitado ?? false,
      nome_agente:     nome_agente || 'Lia',
      segmento:        segmento || 'franquias',
      pitch_principal: pitch_principal || '',
      capital_minimo:  parseInt(capital_minimo) || 0,
      max_turns:       parseInt(max_turns) || 14,
      prompt_extra:    prompt_extra || '',
      updated_at:      new Date().toISOString(),
    }, { onConflict: 'tenant_id' })
    .select()
    .single()

  if (error) return res.status(500).json({ success: false, error: error.message })

  invalidarCacheAgente(targetTenantId)
  res.json({ success: true, config: data })
})

// ============================================================
// GET /api/agente/conversas
// Lista conversas do agente para o tenant
// ============================================================
router.get('/conversas', async (req, res) => {
  const usuario = await autenticar(req, res)
  if (!usuario) return

  const superAdmin = isSuperAdmin(usuario)
  const targetTenantId = superAdmin && req.query.tenant_id
    ? req.query.tenant_id
    : usuario.tenant_id

  if (!targetTenantId) return res.status(400).json({ success: false, error: 'tenant_id obrigatório' })

  const limit = Math.min(parseInt(req.query.limit) || 50, 200)
  const status = req.query.status

  let q = supabase
    .from('agente_conversas')
    .select('id, telefone, status, criado_em, atualizado_em, lead_id, resumo')
    .eq('tenant_id', targetTenantId)
    .order('atualizado_em', { ascending: false })
    .limit(limit)

  if (status && status !== 'todas') q = q.eq('status', status)

  const { data, error } = await q
  if (error) return res.status(500).json({ success: false, error: error.message })

  res.json({ success: true, conversas: data || [], total: data?.length || 0 })
})

// ============================================================
// GET /api/agente/conversas/:id
// Detalhes de uma conversa (com histórico completo)
// ============================================================
router.get('/conversas/:id', async (req, res) => {
  const usuario = await autenticar(req, res)
  if (!usuario) return

  const { data, error } = await supabase
    .from('agente_conversas')
    .select('*')
    .eq('id', req.params.id)
    .single()

  if (error || !data) return res.status(404).json({ success: false, error: 'Conversa não encontrada' })

  if (!isSuperAdmin(usuario) && data.tenant_id !== usuario.tenant_id) {
    return res.status(403).json({ success: false, error: 'Acesso negado' })
  }

  res.json({ success: true, conversa: data })
})

// ============================================================
// GET /api/agente/stats
// Estatísticas do agente para o tenant
// ============================================================
router.get('/stats', async (req, res) => {
  const usuario = await autenticar(req, res)
  if (!usuario) return

  const superAdmin = isSuperAdmin(usuario)
  const targetTenantId = superAdmin && req.query.tenant_id
    ? req.query.tenant_id
    : usuario.tenant_id

  if (!targetTenantId) return res.status(400).json({ success: false, error: 'tenant_id obrigatório' })

  const { data, error } = await supabase
    .from('agente_conversas')
    .select('status')
    .eq('tenant_id', targetTenantId)

  if (error) return res.status(500).json({ success: false, error: error.message })

  const stats = (data || []).reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1
    acc.total++
    return acc
  }, { total: 0, ativa: 0, handoff: 0, encerrada: 0 })

  res.json({ success: true, stats })
})

// ============================================================
// GET /api/agente/tenants (apenas super_admin)
// Lista todos os tenants com status do agente — para painel admin
// ============================================================
router.get('/tenants', async (req, res) => {
  const usuario = await autenticar(req, res)
  if (!usuario) return

  if (!isSuperAdmin(usuario)) {
    return res.status(403).json({ success: false, error: 'Acesso apenas para super_admin' })
  }

  const [{ data: tenants }, { data: configs }] = await Promise.all([
    supabase.from('tenants').select('id, nome, slug').order('nome'),
    supabase.from('agente_configs').select('*'),
  ])

  const configMap = Object.fromEntries((configs || []).map(c => [c.tenant_id, c]))

  const resultado = (tenants || []).map(t => ({
    tenant: t,
    agente: configMap[t.id] || null,
  }))

  res.json({ success: true, tenants: resultado })
})

export default router

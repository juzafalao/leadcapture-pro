// ============================================================
// ROUTES — /api/webhooks
// LeadCapture Pro · Zafalão Tech
//
// Dia 10 do Sprint CRM — configuração de webhooks de saída:
//   GET    /api/webhooks/eventos   — lista eventos disponíveis
//   GET    /api/webhooks           — listar configs do tenant
//   POST   /api/webhooks           — criar config
//   PUT    /api/webhooks/:id       — atualizar config
//   DELETE /api/webhooks/:id       — remover config
//   POST   /api/webhooks/test/:id  — disparar evento de teste
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { EVENTOS } from '../services/webhookDispatcher.js'

const router = Router()
const ROLES_GESTOR = ['Gestor', 'Diretor', 'Administrador', 'admin']

// ─── Helper de autenticação (requer Gestor+) ─────────────────
async function autenticarGestor(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) throw Object.assign(new Error('Token obrigatório'), { status: 401 })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw Object.assign(new Error('Token inválido'), { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, role, tenant_id, is_super_admin')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 401 })

  const podeGerenciar = ROLES_GESTOR.includes(usuario.role) || usuario.is_super_admin
  if (!podeGerenciar) throw Object.assign(new Error('Sem permissão (requer Gestor+)'), { status: 403 })

  return usuario
}

function errStatus(err) {
  return err.status || 500
}

// ============================================================
// GET /api/webhooks/eventos — lista eventos disponíveis (público da rota)
// Fica ANTES de /:id para não colidir
// ============================================================
router.get('/eventos', (_req, res) => {
  res.json({ success: true, eventos: EVENTOS })
})

// ============================================================
// POST /api/webhooks/test/:id — dispara evento de teste
// Fica ANTES de /:id para não colidir
// ============================================================
router.post('/test/:id', async (req, res) => {
  try {
    const usuario = await autenticarGestor(req)
    const { id } = req.params

    const { data: wh } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (!wh || wh.tenant_id !== usuario.tenant_id) {
      return res.status(404).json({ success: false, error: 'Webhook não encontrado' })
    }

    const body = JSON.stringify({
      evento: 'teste',
      tenant_id: usuario.tenant_id,
      timestamp: new Date().toISOString(),
      dados: { message: 'Teste de conexão LeadCapture Pro', webhook_id: id },
    })

    const headers = { 'Content-Type': 'application/json' }
    if (wh.secret_token) headers['X-Webhook-Secret'] = wh.secret_token

    let respStatus = null
    let ok = false
    let erroMsg = null

    try {
      const response = await fetch(wh.url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(10_000),
      })
      respStatus = response.status
      ok = response.ok
    } catch (fetchErr) {
      erroMsg = fetchErr.message
    }

    res.json({ success: true, status: respStatus, ok, erro: erroMsg })
  } catch (err) {
    console.error('[Webhooks] POST /test:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// GET /api/webhooks — listar configs do tenant
// ============================================================
router.get('/', async (req, res) => {
  try {
    const usuario = await autenticarGestor(req)

    const { data, error } = await supabase
      .from('webhook_configs')
      .select('id, nome, url, eventos, ativo, created_at, updated_at')
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, webhooks: data ?? [] })
  } catch (err) {
    console.error('[Webhooks] GET:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// POST /api/webhooks — criar config
// ============================================================
router.post('/', async (req, res) => {
  try {
    const usuario = await autenticarGestor(req)
    const { nome, url, eventos, secret_token } = req.body

    if (!nome?.trim() || !url?.trim() || !eventos?.length) {
      return res.status(400).json({ success: false, error: 'nome, url e eventos são obrigatórios' })
    }

    try { new URL(url) } catch {
      return res.status(400).json({ success: false, error: 'URL inválida' })
    }

    const eventosInvalidos = eventos.filter(e => !EVENTOS.includes(e))
    if (eventosInvalidos.length) {
      return res.status(400).json({ success: false, error: `Eventos inválidos: ${eventosInvalidos.join(', ')}` })
    }

    const { data, error } = await supabase
      .from('webhook_configs')
      .insert([{
        tenant_id: usuario.tenant_id,
        nome: nome.trim(),
        url: url.trim(),
        eventos,
        secret_token: secret_token?.trim() || null,
        ativo: true,
      }])
      .select()
      .single()

    if (error) throw error
    res.status(201).json({ success: true, webhook: data })
  } catch (err) {
    console.error('[Webhooks] POST:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// PUT /api/webhooks/:id — atualizar config
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const usuario = await autenticarGestor(req)
    const { id } = req.params
    const { nome, url, eventos, secret_token, ativo } = req.body

    const { data: existing } = await supabase
      .from('webhook_configs')
      .select('tenant_id')
      .eq('id', id)
      .maybeSingle()

    if (!existing || existing.tenant_id !== usuario.tenant_id) {
      return res.status(404).json({ success: false, error: 'Webhook não encontrado' })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (nome     !== undefined) updates.nome         = nome.trim()
    if (url      !== undefined) {
      try { new URL(url) } catch {
        return res.status(400).json({ success: false, error: 'URL inválida' })
      }
      updates.url = url.trim()
    }
    if (eventos      !== undefined) updates.eventos      = eventos
    if (secret_token !== undefined) updates.secret_token = secret_token?.trim() || null
    if (ativo        !== undefined) updates.ativo        = ativo

    const { data, error } = await supabase
      .from('webhook_configs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    res.json({ success: true, webhook: data })
  } catch (err) {
    console.error('[Webhooks] PUT:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// DELETE /api/webhooks/:id — remover config
// ============================================================
router.delete('/:id', async (req, res) => {
  try {
    const usuario = await autenticarGestor(req)
    const { id } = req.params

    const { data: existing } = await supabase
      .from('webhook_configs')
      .select('tenant_id')
      .eq('id', id)
      .maybeSingle()

    if (!existing || existing.tenant_id !== usuario.tenant_id) {
      return res.status(404).json({ success: false, error: 'Webhook não encontrado' })
    }

    const { error } = await supabase
      .from('webhook_configs')
      .delete()
      .eq('id', id)

    if (error) throw error
    res.json({ success: true })
  } catch (err) {
    console.error('[Webhooks] DELETE:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

export default router

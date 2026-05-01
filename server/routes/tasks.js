// ============================================================
// ROUTES — /api/tasks
// LeadCapture Pro · Zafalão Tech
//
// Dias 2, 4, 6, 8 do Sprint CRM:
//   POST   /api/tasks             — criar tarefa
//   GET    /api/tasks?lead_id=    — listar tarefas de um lead
//   PUT    /api/tasks/:id         — atualizar status/campos
//   POST   /api/tasks/interacao   — registrar interação manual
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'
import { dispatchWebhookEvent } from '../services/webhookDispatcher.js'

const router = Router()

// ─── Helper de autenticação ───────────────────────────────────
async function autenticar(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  if (!token) throw Object.assign(new Error('Token obrigatório'), { status: 401 })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw Object.assign(new Error('Token inválido'), { status: 401 })

  const { data: usuario } = await supabase
    .from('usuarios')
    .select('id, nome, role, tenant_id, is_super_admin, is_platform')
    .eq('auth_id', user.id)
    .maybeSingle()

  if (!usuario) throw Object.assign(new Error('Usuário não encontrado'), { status: 401 })
  return usuario
}

function errStatus(err) {
  return err.status || (/Token|permiss/i.test(err.message) ? 401 : 500)
}

// ============================================================
// POST /api/tasks — Criar tarefa (Dia 2)
// ============================================================
router.post('/', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { lead_id, titulo, descricao, prioridade = 'normal', data_vencimento } = req.body

    if (!lead_id || !titulo?.trim()) {
      return res.status(400).json({ success: false, error: 'lead_id e titulo são obrigatórios' })
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('id, tenant_id')
      .eq('id', lead_id)
      .maybeSingle()

    if (!lead) return res.status(404).json({ success: false, error: 'Lead não encontrado' })

    const mesmoTenant = lead.tenant_id === usuario.tenant_id
    if (!mesmoTenant && !usuario.is_super_admin && !usuario.is_platform) {
      return res.status(403).json({ success: false, error: 'Lead pertence a outro tenant' })
    }

    const { data: tarefa, error } = await supabase
      .from('tarefas')
      .insert([{
        tenant_id: usuario.tenant_id,
        lead_id,
        usuario_id: usuario.id,
        titulo: titulo.trim(),
        descricao: descricao?.trim() || null,
        prioridade,
        data_vencimento: data_vencimento || null,
        status: 'pendente',
      }])
      .select()
      .single()

    if (error) throw error

    // Registra evento na timeline (Dia 9)
    await supabase.from('lead_historico').insert([{
      lead_id,
      tenant_id: usuario.tenant_id,
      usuario_id: usuario.id,
      usuario_nome: usuario.nome,
      tipo: 'tarefa_criada',
      descricao: `Tarefa criada: "${tarefa.titulo}"`,
      dados: { tarefa_id: tarefa.id, prioridade: tarefa.prioridade, data_vencimento },
    }])

    // Dispara webhooks (Dia 10)
    dispatchWebhookEvent(usuario.tenant_id, 'tarefa_criada', {
      tarefa_id: tarefa.id, lead_id, titulo: tarefa.titulo, prioridade: tarefa.prioridade,
    }).catch(() => {})

    res.status(201).json({ success: true, tarefa })
  } catch (err) {
    console.error('[Tasks] POST:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// POST /api/tasks/interacao — Registrar interação manual (Dia 8)
// Deve ficar ANTES de /:id para não colidir
// ============================================================
router.post('/interacao', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { lead_id, tipo_interacao = 'outro', descricao } = req.body

    if (!lead_id || !descricao?.trim()) {
      return res.status(400).json({ success: false, error: 'lead_id e descricao são obrigatórios' })
    }

    const TIPOS_VALIDOS = ['ligacao', 'reuniao', 'email', 'visita', 'outro']
    if (!TIPOS_VALIDOS.includes(tipo_interacao)) {
      return res.status(400).json({ success: false, error: `tipo_interacao inválido. Valores: ${TIPOS_VALIDOS.join(', ')}` })
    }

    const { data: lead } = await supabase
      .from('leads')
      .select('id, tenant_id')
      .eq('id', lead_id)
      .maybeSingle()

    if (!lead) return res.status(404).json({ success: false, error: 'Lead não encontrado' })

    const LABELS = { ligacao: 'Ligação', reuniao: 'Reunião', email: 'E-mail', visita: 'Visita', outro: 'Interação' }

    const { data: evento, error } = await supabase
      .from('lead_historico')
      .insert([{
        lead_id,
        tenant_id: usuario.tenant_id,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        tipo: 'interacao_manual',
        descricao: `${LABELS[tipo_interacao]}: ${descricao.trim()}`,
        dados: { tipo_interacao },
      }])
      .select()
      .single()

    if (error) throw error

    dispatchWebhookEvent(usuario.tenant_id, 'interacao_manual', {
      lead_id, tipo_interacao, descricao: descricao.trim(),
    }).catch(() => {})

    res.status(201).json({ success: true, evento })
  } catch (err) {
    console.error('[Tasks] POST /interacao:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// GET /api/tasks?lead_id=xxx — Listar tarefas de um lead (Dia 4)
// ============================================================
router.get('/', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { lead_id } = req.query

    if (!lead_id) return res.status(400).json({ success: false, error: 'lead_id é obrigatório' })

    const { data, error } = await supabase
      .from('tarefas')
      .select('*, usuario:usuario_id(id, nome, role)')
      .eq('lead_id', lead_id)
      .eq('tenant_id', usuario.tenant_id)
      .order('created_at', { ascending: false })

    if (error) throw error
    res.json({ success: true, tarefas: data ?? [] })
  } catch (err) {
    console.error('[Tasks] GET:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

// ============================================================
// PUT /api/tasks/:id — Atualizar tarefa (Dias 6 e 7)
// ============================================================
router.put('/:id', async (req, res) => {
  try {
    const usuario = await autenticar(req)
    const { id } = req.params
    const { status, titulo, descricao, prioridade, data_vencimento } = req.body

    const { data: tarefa } = await supabase
      .from('tarefas')
      .select('id, lead_id, tenant_id, titulo, status')
      .eq('id', id)
      .maybeSingle()

    if (!tarefa) return res.status(404).json({ success: false, error: 'Tarefa não encontrada' })

    if (tarefa.tenant_id !== usuario.tenant_id && !usuario.is_super_admin) {
      return res.status(403).json({ success: false, error: 'Sem permissão' })
    }

    const updates = { updated_at: new Date().toISOString() }
    if (status     !== undefined) {
      updates.status = status
      if (status === 'concluida') updates.concluida_em = new Date().toISOString()
      if (status === 'pendente')  updates.concluida_em = null
    }
    if (titulo          !== undefined) updates.titulo          = titulo.trim()
    if (descricao       !== undefined) updates.descricao       = descricao?.trim() || null
    if (prioridade      !== undefined) updates.prioridade      = prioridade
    if (data_vencimento !== undefined) updates.data_vencimento = data_vencimento || null

    const { data: updated, error } = await supabase
      .from('tarefas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Registra conclusão na timeline (Dia 9)
    if (status === 'concluida') {
      await supabase.from('lead_historico').insert([{
        lead_id: tarefa.lead_id,
        tenant_id: usuario.tenant_id,
        usuario_id: usuario.id,
        usuario_nome: usuario.nome,
        tipo: 'tarefa_concluida',
        descricao: `Tarefa concluída: "${tarefa.titulo}"`,
        dados: { tarefa_id: id },
      }])

      dispatchWebhookEvent(usuario.tenant_id, 'tarefa_concluida', {
        tarefa_id: id, lead_id: tarefa.lead_id, titulo: tarefa.titulo,
      }).catch(() => {})
    }

    res.json({ success: true, tarefa: updated })
  } catch (err) {
    console.error('[Tasks] PUT:', err.message)
    res.status(errStatus(err)).json({ success: false, error: err.message })
  }
})

export default router

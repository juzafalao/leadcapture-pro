// server/routes/ranking.js
// Rota de ranking de consultores -- usa service role para bypassar RLS
// Permite que admins vejam qualquer tenant

import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'

const router = Router()

// Service role client -- bypassa RLS completamente
function getAdminClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_ANON_KEY
  
  if (!url || !key) {
    throw new Error('Supabase nao configurado')
  }
  
  return createClient(url, key, { auth: { persistSession: false } })
}

// Verifica token Bearer do usuario com fallback para desenvolvimento
async function verificarToken(req) {
  const token = (req.headers.authorization || '').replace('Bearer ', '').trim()
  
  if (!token) {
    console.warn('[Ranking] Token nao fornecido')
    if (process.env.NODE_ENV !== 'production') {
      console.log('[Ranking] DEV MODE: permitindo sem token')
      return { role: 'admin', tenant_id: req.query.tenant_id }
    }
    return null
  }
  
  try {
    const sb = getAdminClient()
    const { data: { user }, error } = await sb.auth.getUser(token)
    
    if (error || !user) {
      console.warn('[Ranking] Token invalido:', error?.message)
      return null
    }
    
    const { data } = await sb.from('usuarios')
      .select('id, nome, role, tenant_id, is_super_admin, is_platform')
      .eq('auth_id', user.id)
      .maybeSingle()
    
    return data
  } catch (err) {
    console.error('[Ranking] Erro ao verificar token:', err.message)
    return null
  }
}

// GET /api/ranking/usuarios?tenant_id=xxx&ano=2026&mes=4
router.get('/usuarios', async (req, res) => {
  try {
    console.log('[Ranking/usuarios] Iniciando requisicao')
    console.log('[Ranking/usuarios] Query params:', req.query)
    
    const usuario = await verificarToken(req)
    const isDevMode = process.env.NODE_ENV !== 'production'
    
    console.log('[Ranking/usuarios] Usuario autenticado:', usuario?.id)
    console.log('[Ranking/usuarios] Dev mode:', isDevMode)

    if (!usuario && !isDevMode) {
      console.warn('[Ranking/usuarios] Acesso negado - nao autenticado')
      return res.status(401).json({ 
        success: false,
        error: 'Nao autorizado',
        debug: 'Token invalido ou nao fornecido'
      })
    }

    const isAdmin = usuario 
      ? (['Administrador','admin','Diretor'].includes(usuario.role)
        || usuario.is_super_admin || usuario.is_platform)
      : isDevMode

    const tenantId = (isAdmin && req.query.tenant_id)
      ? req.query.tenant_id
      : usuario?.tenant_id

    if (!tenantId) {
      console.error('[Ranking/usuarios] tenant_id obrigatorio')
      return res.status(400).json({ 
        success: false,
        error: 'tenant_id obrigatorio'
      })
    }

    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)

    console.log('[Ranking/usuarios] Buscando dados:', { tenantId, ano, mes })

    const sb = getAdminClient()

    const { data: users, error: usersErr } = await sb
      .from('usuarios')
      .select('id, nome, role, role_emoji, role_color')
      .eq('tenant_id', tenantId)
      .neq('role', 'Cliente')
      .order('nome')

    if (usersErr) {
      console.error('[Ranking/usuarios] Erro ao buscar usuarios:', usersErr.message)
      return res.status(500).json({ 
        success: false,
        error: 'Erro ao buscar usuarios',
        debug: usersErr.message
      })
    }

    console.log('[Ranking/usuarios] Usuarios encontrados:', users?.length)

    if (!users?.length) {
      console.log('[Ranking/usuarios] Sem usuarios neste tenant')
      return res.json({ 
        success: true,
        consultores: [], 
        tenantId,
        total_leads: 0,
        debug: 'Sem usuarios neste tenant'
      })
    }

    const inicio = new Date(ano, mes - 1, 1).toISOString()
    const fim    = new Date(ano, mes, 0, 23, 59, 59).toISOString()

    console.log('[Ranking/usuarios] Buscando leads de', inicio, 'ate', fim)

    const { data: leads, error: leadsErr } = await sb
      .from('leads')
      .select('id, score, categoria, capital_disponivel, id_operador_responsavel, operador_id, status, created_at')
      .eq('tenant_id', tenantId)
      .gte('created_at', inicio)
      .lte('created_at', fim)
      .is('deleted_at', null)

    if (leadsErr) {
      console.warn('[Ranking/usuarios] Erro ao buscar leads:', leadsErr.message)
    }

    console.log('[Ranking/usuarios] Leads encontrados:', leads?.length)

    const mapa = {}
    for (const lead of (leads || [])) {
      const uid = lead.id_operador_responsavel || lead.operador_id
      if (!uid) continue
      if (!mapa[uid]) mapa[uid] = { total: 0, hot: 0, convertido: 0, capital: 0 }
      mapa[uid].total++
      if (lead.categoria === 'hot')     mapa[uid].hot++
      if (lead.status === 'convertido') mapa[uid].convertido++
      mapa[uid].capital += parseFloat(lead.capital_disponivel || 0)
    }

    const consultores = users
      .map(u => ({
        id:           u.id,
        nome:         u.nome,
        role:         u.role,
        role_emoji:   u.role_emoji,
        role_color:   u.role_color,
        total_leads:  mapa[u.id]?.total     ?? 0,
        leads_hot:    mapa[u.id]?.hot        ?? 0,
        convertidos:  mapa[u.id]?.convertido ?? 0,
        capital_total:mapa[u.id]?.capital    ?? 0,
      }))
      .sort((a, b) => b.total_leads - a.total_leads || b.capital_total - a.capital_total)

    console.log('[Ranking/usuarios] Retornando', consultores.length, 'consultores')

    res.json({ 
      success: true,
      consultores, 
      tenantId, 
      total_leads: leads?.length ?? 0,
      periodo: { ano, mes },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[Ranking/usuarios] Erro critico:', err)
    res.status(500).json({ 
      success: false,
      error: 'Erro interno do servidor',
      debug: process.env.NODE_ENV !== 'production' ? err.message : undefined
    })
  }
})

// GET /api/ranking/meta?tenant_id=xxx&ano=2026&mes=4
router.get('/meta', async (req, res) => {
  try {
    console.log('[Ranking/meta] Iniciando requisicao')
    
    const usuario = await verificarToken(req)
    const isDevMode = process.env.NODE_ENV !== 'production'
    
    if (!usuario && !isDevMode) {
      return res.status(401).json({ 
        success: false,
        error: 'Nao autorizado'
      })
    }

    const tenantId = req.query.tenant_id || usuario?.tenant_id
    const ano = parseInt(req.query.ano) || new Date().getFullYear()
    const mes = parseInt(req.query.mes) || (new Date().getMonth() + 1)

    if (!tenantId) {
      return res.status(400).json({ 
        success: false,
        error: 'tenant_id obrigatorio'
      })
    }

    const sb = getAdminClient()
    const { data, error } = await sb
      .from('ranking_metas')
      .select('meta_valor')
      .eq('tenant_id', tenantId)
      .eq('ano', ano)
      .eq('mes', mes)
      .is('consultor_id', null)
      .maybeSingle()

    if (error) {
      console.warn('[Ranking/meta] Erro ao buscar meta:', error.message)
    }

    res.json({ 
      success: true,
      meta: data?.meta_valor ?? 30,
      periodo: { ano, mes },
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('[Ranking/meta] Erro:', err)
    res.status(500).json({ 
      success: false,
      error: 'Erro ao buscar meta',
      debug: process.env.NODE_ENV !== 'production' ? err.message : undefined
    })
  }
})

export default router
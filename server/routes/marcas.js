// ============================================================
// ROUTES — /api/marcas
// Consulta de marcas para landing pages e integrações
// ============================================================

import { Router } from 'express'
import supabase from '../core/database.js'

const router = Router()

// ─────────────────────────────────────────────
// GET /api/marcas/slug/:slug
// Busca marca pelo slug exato (landing pages)
// ─────────────────────────────────────────────
router.get('/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params

    const { data, error } = await supabase
      .from('marcas')
      .select('id, nome, slug, emoji, invest_min, invest_max, id_segmento, tenant_id')
      .eq('slug', slug)
      .eq('ativo', true)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Marca não encontrada' })
    }

    res.json({ success: true, marca: data })
  } catch (err) {
    console.error('[Marcas] Erro ao buscar por slug:', err.message)
    res.status(500).json({ success: false, error: 'Erro no servidor' })
  }
})

// ─────────────────────────────────────────────
// GET /api/marcas/:slug
// Busca marca pelo nome (case-insensitive, legacy)
// ─────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase().replace(/-/g, ' ')

    const { data, error } = await supabase
      .from('marcas')
      .select('id, nome, emoji, invest_min, invest_max, id_segmento, tenant_id')
      .ilike('nome', slug)
      .eq('ativo', true)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'Marca não encontrada' })
    }

    res.json({ success: true, marca: data })
  } catch (err) {
    console.error('[Marcas] Erro ao buscar por nome:', err.message)
    res.status(500).json({ success: false, error: 'Erro interno ao buscar marca' })
  }
})

export default router

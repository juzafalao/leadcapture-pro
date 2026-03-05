// ============================================================
// validateLead.js — Validação de payload com Zod
// LeadCapture Pro — Zafalão Tech
//
// Middleware que valida o corpo do POST /api/leads
// Rejeita payloads inválidos com 400 + mensagem clara
// Strip de campos desconhecidos (segurança contra injection)
// ============================================================

import { z } from 'zod'

// Schema de validação para leads de franqueados
const leadSchema = z.object({
  nome:               z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200).trim(),
  email:              z.string().email('Email inválido').max(255).trim().optional().or(z.literal('')),
  telefone:           z.string().min(8, 'Telefone deve ter pelo menos 8 dígitos').max(20).trim().optional().or(z.literal('')),
  instagram:          z.string().max(100).trim().optional().or(z.literal('')),
  mensagem_original:  z.string().max(5000).trim().optional().or(z.literal('')),
  fonte:              z.string().max(100).trim().optional().or(z.literal('')),
  score:              z.number().int().min(0).max(100).optional(),
  categoria:          z.enum(['hot', 'warm', 'cold']).optional(),
  capital_disponivel: z.number().min(0).optional().nullable(),
  regiao_interesse:   z.string().max(200).trim().optional().or(z.literal('')),
  cidade:             z.string().max(100).trim().optional().or(z.literal('')),
  estado:             z.string().max(50).trim().optional().or(z.literal('')),
  urgencia:           z.enum(['baixa', 'normal', 'alta', 'urgente']).optional(),
  tenant_id:          z.string().uuid('tenant_id deve ser UUID válido'),
  id_marca:           z.string().uuid('id_marca deve ser UUID válido').optional().nullable(),
}).strip() // Remove campos não declarados (segurança)

// Schema para leads_sistema (prospects do SaaS)
const leadSistemaSchema = z.object({
  nome:              z.string().min(2).max(200).trim(),
  email:             z.string().email().max(255).trim().optional().or(z.literal('')),
  telefone:          z.string().min(8).max(20).trim().optional().or(z.literal('')),
  empresa:           z.string().max(200).trim().optional().or(z.literal('')),
  mensagem:          z.string().max(5000).trim().optional().or(z.literal('')),
  fonte:             z.string().max(100).trim().optional().or(z.literal('')),
  observacao_original: z.string().max(5000).trim().optional().or(z.literal('')),
}).strip()

// Schema para Google Forms (campos podem vir com nomes diferentes)
const googleFormsSchema = z.object({
  nome:     z.string().min(1).max(200).trim().optional().or(z.literal('')),
  email:    z.string().max(255).trim().optional().or(z.literal('')),
  telefone: z.string().max(20).trim().optional().or(z.literal('')),
  mensagem: z.string().max(5000).trim().optional().or(z.literal('')),
}).passthrough() // Google Forms pode enviar campos extras

/**
 * Middleware factory que valida o body contra um schema Zod
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      const errors = result.error.issues.map(issue => ({
        campo: issue.path.join('.'),
        mensagem: issue.message,
      }))

      return res.status(400).json({
        success: false,
        error: 'Dados inválidos',
        detalhes: errors,
      })
    }

    // Substituir body pelo dados validados e sanitizados
    req.body = result.data
    next()
  }
}

export const validateLead        = validate(leadSchema)
export const validateLeadSistema = validate(leadSistemaSchema)
export const validateGoogleForms = validate(googleFormsSchema)
export { leadSchema, leadSistemaSchema, googleFormsSchema }

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('✅ Supabase inicializado')

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: 'LeadCapture Pro'
  })
})

// API: Criar lead (landing pages)
app.post('/api/leads', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📥 Novo lead recebido')
    
    const leadData = req.body
    
    const required = ['tenant_id', 'marca_id', 'nome', 'email', 'telefone']
    for (const field of required) {
      if (!leadData[field]) {
        return res.status(400).json({ 
          success: false, 
          error: `Campo obrigatório: ${field}` 
        })
      }
    }
    
    if (leadData.nome.trim().length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome deve ter pelo menos 3 caracteres' 
      })
    }
    
    if (!leadData.email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email inválido' 
      })
    }
    
    if (leadData.telefone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telefone inválido' 
      })
    }
    
    if (leadData.documento) {
      const documentoLimpo = leadData.documento.replace(/\D/g, '')
      
      if (documentoLimpo.length !== 11 && documentoLimpo.length !== 14) {
        return res.status(400).json({ 
          success: false, 
          error: 'Documento inválido. Deve ser CPF (11 dígitos) ou CNPJ (14 dígitos)' 
        })
      }
      
      leadData.documento = documentoLimpo
      leadData.tipo_documento = documentoLimpo.length === 11 ? 'CPF' : 'CNPJ'
    }
    
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
    
    if (error) throw error
    
    console.log('✅ Lead salvo:', data[0].id)
    console.log('   Nome:', data[0].nome)
    console.log('   Email:', data[0].email)
    console.log('   Marca:', data[0].marca_id)
    if (data[0].documento) {
      console.log('   Documento:', data[0].tipo_documento, '-', data[0].documento)
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    res.json({ 
      success: true, 
      message: 'Lead recebido com sucesso!',
      leadId: data[0].id
    })
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

// API: Receber lead do Google Forms
app.post('/api/leads/google-forms', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Lead do Google Forms recebido')
    
    const formData = req.body
    console.log('Dados brutos:', JSON.stringify(formData, null, 2))
    
    const leadData = {
      tenant_id: formData.tenant_id || '81cac3a4-caa3-43b2-be4d-d16557d7ef88',
      marca_id: formData.marca_id,
      fonte: 'google-forms',
      nome: formData.nome || formData['Nome completo'] || formData.name,
      email: formData.email || formData['E-mail'] || formData['E-mail address'],
      telefone: (formData.telefone || formData['WhatsApp'] || formData.whatsapp || '').replace(/\D/g, ''),
      cidade: formData.cidade || formData['Cidade'] || '',
      estado: formData.estado || formData['Estado'] || '',
      status: 'novo',
      categoria: 'cold',
      score: 50
    }
    
    const documento = (formData.documento || formData['CPF ou CNPJ'] || formData.cpf_cnpj || '').replace(/\D/g, '')
    if (documento) {
      leadData.documento = documento
      leadData.tipo_documento = documento.length === 11 ? 'CPF' : 'CNPJ'
    }
    
    const capitalStr = (formData.capital || formData['Capital disponível'] || formData.capital_disponivel || '0').replace(/\D/g, '')
    const capital = parseInt(capitalStr) || 0
    leadData.capital_disponivel = capital
    
    let score = 50
    if (capital >= 500000) score = 95
    else if (capital >= 300000) score = 90
    else if (capital >= 200000) score = 80
    else if (capital >= 150000) score = 70
    else if (capital >= 100000) score = 60
    else if (capital >= 80000) score = 55
    
    leadData.score = score
    
    let categoria = 'cold'
    if (score >= 80) categoria = 'hot'
    else if (score >= 60) categoria = 'warm'
    
    leadData.categoria = categoria
    
    const mensagem = formData.mensagem || formData['Mensagem'] || formData.message || ''
    leadData.mensagem_original = mensagem
    leadData.observacao = `Capital: R$ ${capital.toLocaleString('pt-BR')} | Origem: Google Forms${mensagem ? ' | ' + mensagem : ''}`
    
    if (!leadData.nome || leadData.nome.length < 3) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome inválido ou ausente' 
      })
    }
    
    if (!leadData.email || !leadData.email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email inválido ou ausente' 
      })
    }
    
    if (!leadData.telefone || leadData.telefone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        error: 'Telefone inválido ou ausente' 
      })
    }
    
    if (!leadData.marca_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'marca_id é obrigatório' 
      })
    }
    
    const { data: existente, error: erroConsulta } = await supabase
      .from('leads')
      .select('id, email, created_at')
      .eq('email', leadData.email)
      .eq('marca_id', leadData.marca_id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (erroConsulta) {
      console.error('Erro ao verificar duplicação:', erroConsulta)
    }
    
    if (existente && existente.length > 0) {
      const leadExistente = existente[0]
      const dataExistente = new Date(leadExistente.created_at)
      const horasDesdeUltimo = (Date.now() - dataExistente.getTime()) / (1000 * 60 * 60)
      
      if (horasDesdeUltimo < 24) {
        console.log('⚠️  Lead duplicado detectado (menos de 24h)')
        console.log('   Email:', leadData.email)
        console.log('   ID existente:', leadExistente.id)
        console.log('   Criado há:', Math.round(horasDesdeUltimo), 'horas')
        
        return res.json({ 
          success: true, 
          message: 'Lead já existe (criado recentemente)',
          leadId: leadExistente.id,
          duplicated: true
        })
      }
    }
    
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
    
    if (error) throw error
    
    console.log('✅ Lead do Google Forms salvo:', data[0].id)
    console.log('   Nome:', data[0].nome)
    console.log('   Email:', data[0].email)
    console.log('   Marca:', data[0].marca_id)
    console.log('   Score:', data[0].score)
    console.log('   Categoria:', data[0].categoria)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    res.json({ 
      success: true, 
      message: 'Lead do Google Forms recebido com sucesso!',
      leadId: data[0].id,
      score: data[0].score,
      categoria: data[0].categoria
    })
    
  } catch (error) {
    console.error('❌ Erro ao processar lead do Google Forms:', error.message)
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
    res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
})

app.get('/api/leads/google-forms/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Google Forms Integration',
    timestamp: new Date().toISOString()
  })
})

export default app

// ============================================
// SERVIR DASHBOARD (FRONTEND REACT)
// ============================================
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Servir arquivos estáticos do dashboard
app.use('/dashboard', express.static(join(__dirname, '../dashboard-build')))

// Fallback para SPA (Single Page Application)
app.get('/dashboard/*', (req, res) => {
  res.sendFile(join(__dirname, '../dashboard-build/index.html'))
})

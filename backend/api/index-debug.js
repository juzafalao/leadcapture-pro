import express from 'express'
import cors from 'cors'
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const app = express()
const PORT = 4000

// Supabase - USANDO VARIÁVEL CORRETA
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY  // ← CORRIGIDO!
)

console.log('✅ Supabase inicializado')
console.log('   URL:', process.env.SUPABASE_URL)

// Middleware
app.use(cors())
app.use(express.json())

// Middleware de log ANTES de tudo
app.use((req, res, next) => {
  const timestamp = new Date().toISOString()
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📥 ${timestamp}`)
  console.log(`   Método: ${req.method}`)
  console.log(`   Path: ${req.path}`)
  console.log(`   IP: ${req.ip}`)
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, JSON.stringify(req.body, null, 2))
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  next()
})

// Health check
app.get('/health', (req, res) => {
  console.log('✅ Health check OK')
  res.json({ status: 'ok' })
})

// Health check Google Forms
app.get('/api/leads/google-forms/health', (req, res) => {
  console.log('✅ Google Forms health check OK')
  res.json({ 
    status: 'ok',
    service: 'Google Forms Integration',
    timestamp: new Date().toISOString()
  })
})

// Endpoint Google Forms com LOGS DETALHADOS
app.post('/api/leads/google-forms', async (req, res) => {
  const requestId = Date.now()
  
  try {
    console.log(`🔍 [${requestId}] ========== PROCESSAMENTO INICIADO ==========`)
    console.log(`🔍 [${requestId}] Dados recebidos:`)
    console.log(JSON.stringify(req.body, null, 2))
    
    const formData = req.body
    
    // Mapear campos
    console.log(`🔍 [${requestId}] Mapeando campos...`)
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
    
    console.log(`🔍 [${requestId}] Lead mapeado:`)
    console.log(JSON.stringify(leadData, null, 2))
    
    // Documento
    const documento = (formData.documento || formData['CPF ou CNPJ'] || formData.cpf_cnpj || '').replace(/\D/g, '')
    if (documento) {
      leadData.documento = documento
      leadData.tipo_documento = documento.length === 11 ? 'CPF' : 'CNPJ'
      console.log(`🔍 [${requestId}] Documento: ${leadData.tipo_documento} = ${documento}`)
    }
    
    // Capital
    const capitalStr = (formData.capital || formData['Capital disponível'] || formData.capital_disponivel || '0').replace(/\D/g, '')
    const capital = parseInt(capitalStr) || 0
    leadData.capital_disponivel = capital
    
    console.log(`🔍 [${requestId}] Capital: R$ ${capital}`)
    
    // Score
    let score = 50
    if (capital >= 500000) score = 95
    else if (capital >= 300000) score = 90
    else if (capital >= 200000) score = 80
    else if (capital >= 150000) score = 70
    else if (capital >= 100000) score = 60
    else if (capital >= 80000) score = 55
    
    leadData.score = score
    console.log(`🔍 [${requestId}] Score calculado: ${score}`)
    
    // Categoria
    let categoria = 'cold'
    if (score >= 80) categoria = 'hot'
    else if (score >= 60) categoria = 'warm'
    
    leadData.categoria = categoria
    console.log(`🔍 [${requestId}] Categoria: ${categoria}`)
    
    // Mensagem
    const mensagem = formData.mensagem || formData['Mensagem'] || formData.message || ''
    leadData.mensagem_original = mensagem
    leadData.observacao = `Capital: R$ ${capital.toLocaleString('pt-BR')} | Origem: Google Forms${mensagem ? ' | ' + mensagem : ''}`
    
    // Validações
    console.log(`🔍 [${requestId}] Validando dados...`)
    
    if (!leadData.nome || leadData.nome.length < 3) {
      console.log(`❌ [${requestId}] Nome inválido: "${leadData.nome}"`)
      return res.status(400).json({ 
        success: false, 
        error: 'Nome inválido ou ausente',
        requestId
      })
    }
    
    if (!leadData.email || !leadData.email.includes('@')) {
      console.log(`❌ [${requestId}] Email inválido: "${leadData.email}"`)
      return res.status(400).json({ 
        success: false, 
        error: 'Email inválido ou ausente',
        requestId
      })
    }
    
    if (!leadData.telefone || leadData.telefone.length < 10) {
      console.log(`❌ [${requestId}] Telefone inválido: "${leadData.telefone}"`)
      return res.status(400).json({ 
        success: false, 
        error: 'Telefone inválido ou ausente',
        requestId
      })
    }
    
    if (!leadData.marca_id) {
      console.log(`❌ [${requestId}] marca_id ausente`)
      return res.status(400).json({ 
        success: false, 
        error: 'marca_id é obrigatório',
        requestId
      })
    }
    
    console.log(`✅ [${requestId}] Validações OK`)
    
    // Verificar duplicação
    console.log(`🔍 [${requestId}] Verificando duplicação...`)
    const { data: existente, error: erroConsulta } = await supabase
      .from('leads')
      .select('id, email, created_at')
      .eq('email', leadData.email)
      .eq('marca_id', leadData.marca_id)
      .order('created_at', { ascending: false })
      .limit(1)
    
    if (erroConsulta) {
      console.error(`⚠️ [${requestId}] Erro ao verificar duplicação:`, erroConsulta)
    }
    
    if (existente && existente.length > 0) {
      const leadExistente = existente[0]
      const dataExistente = new Date(leadExistente.created_at)
      const horasDesdeUltimo = (Date.now() - dataExistente.getTime()) / (1000 * 60 * 60)
      
      if (horasDesdeUltimo < 24) {
        console.log(`⚠️ [${requestId}] Lead duplicado detectado (${Math.round(horasDesdeUltimo)}h atrás)`)
        return res.json({ 
          success: true, 
          message: 'Lead já existe (criado recentemente)',
          leadId: leadExistente.id,
          duplicated: true,
          requestId
        })
      }
    }
    
    // Salvar no Supabase
    console.log(`💾 [${requestId}] Salvando no Supabase...`)
    console.log(`💾 [${requestId}] Dados finais:`)
    console.log(JSON.stringify(leadData, null, 2))
    
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
    
    if (error) {
      console.error(`❌ [${requestId}] Erro do Supabase:`)
      console.error(JSON.stringify(error, null, 2))
      throw error
    }
    
    console.log(`✅ [${requestId}] ========== LEAD SALVO COM SUCESSO! ==========`)
    console.log(`✅ [${requestId}] Lead ID: ${data[0].id}`)
    console.log(`✅ [${requestId}] Nome: ${data[0].nome}`)
    console.log(`✅ [${requestId}] Email: ${data[0].email}`)
    console.log(`✅ [${requestId}] Score: ${data[0].score}`)
    console.log(`✅ [${requestId}] Categoria: ${data[0].categoria}`)
    console.log(`✅ [${requestId}] ================================================`)
    console.log('')
    
    res.json({ 
      success: true, 
      message: 'Lead do Google Forms recebido com sucesso!',
      leadId: data[0].id,
      score: data[0].score,
      categoria: data[0].categoria,
      requestId
    })
    
  } catch (error) {
    console.error(`❌ [${requestId}] ========== ERRO CRÍTICO ==========`)
    console.error(`❌ [${requestId}] Mensagem: ${error.message}`)
    console.error(`❌ [${requestId}] Stack:`)
    console.error(error.stack)
    console.error(`❌ [${requestId}] =========================================`)
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      requestId
    })
  }
})

// 404
app.use((req, res) => {
  console.log(`⚠️ Rota não encontrada: ${req.method} ${req.path}`)
  res.status(404).json({ error: 'Rota não encontrada' })
})

app.listen(PORT, () => {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 SERVIDOR RODANDO (MODO DEBUG)')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`   Porta: ${PORT}`)
  console.log(`   Health: http://localhost:${PORT}/health`)
  console.log(`   Google Forms: http://localhost:${PORT}/api/leads/google-forms`)
  console.log('')
  console.log('   🔍 LOGS DETALHADOS ATIVADOS')
  console.log('   Todas as requisições serão logadas')
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
})

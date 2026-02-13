import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { createClient } from '@supabase/supabase-js'

// ============================================
// CONFIGURAÇÕES
// ============================================
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config()

const app = express()

// ============================================
// MIDDLEWARES
// ============================================
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')))

// ============================================
// SUPABASE
// ============================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

console.log('✅ Supabase inicializado')

// ============================================
// ROTAS
// ============================================

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
    
    // Validações
    const required = ['tenant_id', 'marca_id', 'nome', 'email', 'telefone']
    for (const field of required) {
      if (!leadData[field]) {
        return res.status(400).json({ 
          success: false, 
          error: `Campo obrigatório: ${field}` 
        })
      }
    }
    
    // Salvar no Supabase
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
    
    if (error) throw error
    
    console.log('✅ Lead salvo:', data[0].id)
    console.log('   Nome:', data[0].nome)
    console.log('   Email:', data[0].email)
    console.log('   Marca:', data[0].marca_id)
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

// ============================================
// INICIAR SERVIDOR
// ============================================
const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 LeadCapture Pro - Backend')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📡 Servidor: http://localhost:${PORT}`)
  console.log(`💚 Health: http://localhost:${PORT}/health`)
  console.log(`📊 API Leads: POST http://localhost:${PORT}/api/leads`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('✅ Pronto para receber leads!')
  console.log('')
})

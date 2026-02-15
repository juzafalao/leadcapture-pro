#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 ADICIONAR ENDPOINT GOOGLE FORMS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Adicionar rota no index.js
cat >> index.js << 'ROUTE'

// ============================================
// API: Receber lead do Google Forms
// ============================================
app.post('/api/leads/google-forms', async (req, res) => {
  try {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📝 Lead do Google Forms recebido')
    
    const formData = req.body
    console.log('Dados brutos:', JSON.stringify(formData, null, 2))
    
    // Mapear campos do Google Forms para o formato do banco
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
    
    // Documento (CPF/CNPJ) - opcional
    const documento = (formData.documento || formData['CPF ou CNPJ'] || formData.cpf_cnpj || '').replace(/\D/g, '')
    if (documento) {
      leadData.documento = documento
      leadData.tipo_documento = documento.length === 11 ? 'CPF' : 'CNPJ'
    }
    
    // Capital disponível
    const capitalStr = (formData.capital || formData['Capital disponível'] || formData.capital_disponivel || '0').replace(/\D/g, '')
    const capital = parseInt(capitalStr) || 0
    leadData.capital_disponivel = capital
    
    // Calcular score baseado no capital
    let score = 50
    if (capital >= 500000) score = 95
    else if (capital >= 300000) score = 90
    else if (capital >= 200000) score = 80
    else if (capital >= 150000) score = 70
    else if (capital >= 100000) score = 60
    else if (capital >= 80000) score = 55
    
    leadData.score = score
    
    // Categoria
    let categoria = 'cold'
    if (score >= 80) categoria = 'hot'
    else if (score >= 60) categoria = 'warm'
    
    leadData.categoria = categoria
    
    // Mensagem/Observação
    const mensagem = formData.mensagem || formData['Mensagem'] || formData.message || ''
    leadData.mensagem_original = mensagem
    leadData.observacao = `Capital: R$ ${capital.toLocaleString('pt-BR')} | Origem: Google Forms${mensagem ? ' | ' + mensagem : ''}`
    
    // Validações básicas
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
    
    // Verificar duplicação (por email)
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
      
      // Se o lead foi criado há menos de 24 horas, considerar duplicado
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
    
    // Salvar no Supabase
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
    console.log('━━━━━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    
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

// Health check para Google Forms webhook
app.get('/api/leads/google-forms/health', (req, res) => {
  res.json({ 
    status: 'ok',
    service: 'Google Forms Integration',
    timestamp: new Date().toISOString()
  })
})
ROUTE

echo "✅ Endpoint adicionado ao backend"
echo ""
echo "📋 Rotas criadas:"
echo "   POST /api/leads/google-forms"
echo "   GET  /api/leads/google-forms/health"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

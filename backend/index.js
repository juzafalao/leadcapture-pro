import app from './app.js'

const PORT = process.env.PORT || 4000

app.listen(PORT, () => {
  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('🚀 LeadCapture Pro - Backend')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log(`📡 Servidor: http://localhost:${PORT}`)
  console.log(`💚 Health: http://localhost:${PORT}/health`)
  console.log(`📊 API Leads: POST http://localhost:${PORT}/api/leads`)
  console.log(`📝 Google Forms: POST http://localhost:${PORT}/api/leads/google-forms`)
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('✅ Pronto para receber leads!')
  console.log('')
})

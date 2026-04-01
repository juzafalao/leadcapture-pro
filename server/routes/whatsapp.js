import { Router } from 'express'

const whatsappRouter = Router()

// Rota de teste
whatsappRouter.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'WhatsApp router is working' })
})

// Webhook para receber mensagens
whatsappRouter.post('/webhook', (req, res) => {
  console.log('[WhatsApp Webhook]', req.body)
  res.json({ success: true })
})

export default whatsappRouter

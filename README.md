# 🚀 LeadCapture Pro

Sistema completo de automação e qualificação de leads para franqueadoras.

## 📊 Visão Geral

LeadCapture Pro é uma plataforma SaaS multi-tenant que permite:
- Captura de leads via múltiplas fontes (Google Forms, Landing Pages, WhatsApp)
- Qualificação automática com scoring inteligente
- Categorização (Quente/Morno/Frio)
- Dashboard completo para gestão
- Notificações automáticas via WhatsApp

## 🏗️ Arquitetura

```
leadcapture-pro/
├── server/              # Backend API (Node.js + Express)
│   ├── app.js          # Lógica Express (sem app.listen)
│   ├── index.js        # Servidor local
│   └── public/
│       └── dashboard/  # Frontend React
├── api/                # Vercel Serverless Function
├── landing-page/       # Landing Pages dos clientes
├── n8n/               # Workflows de automação
├── supabase/          # Banco de dados e migrations
└── docs/              # Documentação completa
```

## 🚀 Deploy Rápido

### Backend + API
```bash
# 1. Configurar variáveis de ambiente no Vercel
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add NODE_ENV

# 2. Deploy
vercel --prod
```

### Frontend (Dashboard)
```bash
cd server/public/dashboard
npm install
npm run build
# Servido automaticamente pelo backend
```

## 🔧 Desenvolvimento Local

```bash
# Backend
cd server
npm install
node index.js

# Frontend
cd server/public/dashboard
npm install
npm run dev
```

## 📚 Documentação Completa

- [Guia de Deploy](docs/deployment/DEPLOY.md)
- [Arquitetura](docs/architecture/ARCHITECTURE.md)
- [API Reference](docs/api/API.md)

## 🛡️ Stack Tecnológica

- **Backend**: Node.js + Express
- **Frontend**: React + Vite + Tailwind CSS
- **Banco**: Supabase (PostgreSQL)
- **Deploy**: Vercel (Serverless)
- **Automação**: n8n
- **Mensageria**: Twilio (WhatsApp)

## 📈 Status

- ✅ Backend API: 90%
- ✅ Frontend Dashboard: 85%
- ✅ Google Forms Integration: 100%
- ✅ Supabase: 100%
- ✅ WhatsApp: 100%
- 🚧 Deploy: Em progresso

## 📄 Licença

Proprietário - LeadCapture Pro © 2026

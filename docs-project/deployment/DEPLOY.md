# 🚀 Guia de Deploy - LeadCapture Pro

## Pré-requisitos

- Conta Vercel
- Conta Supabase
- Node.js 18+
- Git

## Passo a Passo

### 1. Configurar Supabase

```sql
-- Executar migrations
psql -h seu-projeto.supabase.co -U postgres -d postgres -f supabase/migrations/001_initial_schema.sql
```

### 2. Configurar Vercel

```bash
# Install CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### 3. Variáveis de Ambiente

No dashboard do Vercel, adicione:

| Nome | Valor | Ambiente |
|------|-------|----------|
| SUPABASE_URL | https://xxx.supabase.co | Production |
| SUPABASE_SERVICE_KEY | eyJhbG... | Production |
| NODE_ENV | production | Production |

### 4. Testar

```bash
curl https://seu-projeto.vercel.app/health
```

Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T...",
  "service": "LeadCapture Pro"
}
```

## Troubleshooting

### Erro 404
- Verifique se `vercel.json` está correto
- Confirme que variáveis de ambiente foram adicionadas
- Veja logs: `vercel logs`

### Erro de Build
- Verifique `package.json`
- Confirme Node.js version
- Limpe cache: `vercel --force`

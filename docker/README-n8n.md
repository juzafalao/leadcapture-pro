# Rodando o N8N localmente

## Pré-requisitos
- Docker Desktop no Mac
- Backend (`server/`) rodando em localhost:4000

## Iniciar

```bash
cd docker
cp ../.env .env  # copia as vars de ambiente
docker compose -f docker-compose.n8n.yml up -d
```

## Acessar

- URL: http://localhost:5678
- User: admin
- Senha: leadcapture2024

## Configurar webhook na Evolution API

Aponte o webhook para: `http://SEU_IP_LOCAL:4000/api/whatsapp/webhook`
(não use o n8n para o webhook do WhatsApp — o backend processa diretamente)

## Importar workflows

1. Acesse http://localhost:5678
2. Menu → Workflows → Import
3. Importe os arquivos JSON de `n8n/`

## Variáveis de ambiente nos workflows

Configure em Settings → Variables:
- `API_URL`: `http://host.docker.internal:4000`
- `SUPABASE_URL`: URL do seu Supabase

## Estrutura do webhook do backend

O backend recebe eventos diretamente da Evolution API em `/api/whatsapp/webhook`.
O n8n é utilizado para automações complementares (notificações, integrações CRM, etc.)
e recebe eventos via `N8N_WEBHOOK_URL` configurado no `.env`.

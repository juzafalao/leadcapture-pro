# Módulo Automação — LeadCapture Pro

> Workflows n8n para follow-up, alertas e qualificação automática.
> **Zafalão Tech · 2026**

---

## Subir o n8n (Docker)

```bash
docker compose -f docker/docker-compose.yml up -d
```

Acesse: `http://localhost:5678`

---

## Variáveis de ambiente necessárias (no n8n)

| Variável | Descrição |
|---|---|
| `EVOLUTION_API_URL` | URL da Evolution API (ex: `http://localhost:8080`) |
| `EVOLUTION_API_KEY` | Chave da Evolution API |
| `EVOLUTION_INSTANCE` | Nome da instância WhatsApp |
| `TELEGRAM_CHAT_ID` | ID do chat/grupo Telegram para alertas |
| `LEADCAPTURE_API_URL` | URL da API do LeadCapture Pro |
| `LEADCAPTURE_API_TOKEN` | Token de autenticação da API |

---

## Workflows disponíveis

### 1. `boas-vindas-whatsapp.json`
**Gatilho:** Webhook POST em `/lead-criado`
**Ação:** Envia mensagem de boas-vindas via WhatsApp imediatamente.

**Como usar:**
1. Importe o arquivo no n8n
2. Configure o webhook URL
3. No Supabase, crie um Database Webhook que chama o n8n ao inserir em `leads`

---

### 2. `alerta-lead-hot.json`
**Gatilho:** Webhook POST em `/lead-hot`
**Ação:** Envia alerta formatado no Telegram para o gestor.

**Como usar:**
1. Importe no n8n
2. Configure o bot Telegram (credenciais) e o `TELEGRAM_CHAT_ID`
3. Adicione lógica no backend para chamar este webhook ao detectar categoria = `hot`

---

### 3. `followup-48h.json`
**Gatilho:** Cron — executa a cada 6 horas
**Ação:** Busca leads Warm sem contato há 48h e envia follow-up no WhatsApp.

**Como usar:**
1. Importe no n8n
2. Configure as credenciais da API do LeadCapture Pro
3. Ative o workflow — ele roda automaticamente

---

## Arquitetura de automação

```
Novo Lead
    │
    ├── [Webhook n8n] ──► Boas-vindas WhatsApp
    │
    ├── [if categoria=hot] ──► Alerta Telegram
    │
    └── [Cron 6h] ──► Follow-up Warm (48h sem contato)
```

---

## Supabase Database Webhooks

Configure em: `Supabase → Database → Webhooks`

| Evento | Tabela | Webhook URL |
|---|---|---|
| INSERT | `leads` | `https://[seu-n8n]/webhook/lead-criado` |
| UPDATE (categoria=hot) | `leads` | `https://[seu-n8n]/webhook/lead-hot` |

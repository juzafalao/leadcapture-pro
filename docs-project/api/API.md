# 📡 API Reference - LeadCapture Pro

## Base URL

```
https://leadcapture-pro.vercel.app
```

## Endpoints

### Health Check

```http
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-02-16T19:00:00.000Z",
  "service": "LeadCapture Pro"
}
```

### Criar Lead

```http
POST /api/leads
Content-Type: application/json

{
  "tenant_id": "uuid",
  "marca_id": "uuid",
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "11999999999",
  "documento": "12345678900",
  "capital_disponivel": 150000,
  "cidade": "São Paulo",
  "estado": "SP"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead recebido com sucesso!",
  "leadId": "uuid"
}
```

### Google Forms Webhook

```http
POST /api/leads/google-forms
Content-Type: application/json

{
  "marca_id": "uuid",
  "nome": "João Silva",
  "email": "joao@email.com",
  "telefone": "11999999999",
  "capital": "150000"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead do Google Forms recebido com sucesso!",
  "leadId": "uuid",
  "score": 70,
  "categoria": "warm"
}
```

## Scoring

| Capital | Score | Categoria |
|---------|-------|-----------|
| < R$ 80k | 50-55 | Cold |
| R$ 80k-100k | 55-60 | Cold |
| R$ 100k-150k | 60-70 | Warm |
| R$ 150k-200k | 70-80 | Warm |
| R$ 200k-300k | 80-90 | Hot |
| R$ 300k+ | 90-95 | Hot |

## Autenticação

Endpoints públicos não requerem autenticação.
Endpoints do dashboard requerem token JWT.

## Rate Limits

- 100 requisições/minuto por IP
- 1000 requisições/hora por tenant

# 🏗️ ARQUITETURA LEADCAPTURE PRO v2.0
## Documento Técnico Atualizado - 31/01/2026

---

## 📊 PROGRESSO ATUAL DO PROJETO

### Status Geral: **78% Concluído**

```
████████████████████░░░░░ 78%
```

| Módulo | Status | Progresso |
|--------|--------|-----------|
| 🔐 Autenticação (Supabase Auth) | ✅ Funcionando | 100% |
| 🏠 Dashboard + Métricas | ✅ Funcionando | 100% |
| 👥 Gestão de Leads (CRUD) | ✅ Funcionando | 100% |
| 🏷️ Gestão de Marcas (CRUD) | ✅ Funcionando | 100% |
| 👤 Gestão de Usuários (CRUD) | ⚠️ Parcial* | 80% |
| 📊 Relatórios + Export CSV | ✅ Funcionando | 100% |
| 📝 Histórico de Interações | ✅ Funcionando | 100% |
| 🔍 Filtros Avançados | ✅ Funcionando | 100% |
| 🎨 UI/UX Dark Theme | ✅ Funcionando | 100% |
| 🖼️ Sistema de Logos (PNG) | ✅ Funcionando | 100% |
| 🔒 RLS (Row Level Security) | ⏸️ Desabilitado** | 50% |
| 🤖 n8n + IA Qualificação | ⏳ Pendente | 0% |
| 📱 WhatsApp/Twilio | ⏳ Pendente | 0% |

> *Usuários: Cadastro funciona, mas senha é gerenciada no Supabase Auth separadamente
> **RLS: Desabilitado temporariamente para resolver problemas de recursão

---

## 🛠️ STACK TECNOLÓGICA ATUAL

### Frontend
```
┌─────────────────────────────────────────┐
│           FRONTEND (React 19)           │
├─────────────────────────────────────────┤
│  • Vite (Build Tool)                    │
│  • React Query (Estado/Cache)           │
│  • Tailwind CSS (Estilização)           │
│  • Supabase JS Client (API)             │
│  • Porta: 5173 (dev)                    │
└─────────────────────────────────────────┘
```

### Backend/Database
```
┌─────────────────────────────────────────┐
│         SUPABASE (PostgreSQL)           │
├─────────────────────────────────────────┤
│  • Authentication (Email/Password)      │
│  • Database (PostgreSQL 15)             │
│  • Row Level Security (RLS)*            │
│  • Real-time Subscriptions              │
│  • Storage (para logos futuramente)     │
└─────────────────────────────────────────┘
```

### Automação (Pendente)
```
┌─────────────────────────────────────────┐
│              n8n (Workflow)             │
├─────────────────────────────────────────┤
│  • Webhook para captura de leads        │
│  • Integração OpenAI (GPT-4o-mini)      │
│  • Qualificação automática              │
│  • Notificações WhatsApp (Twilio)       │
│  • Porta: 5678                          │
└─────────────────────────────────────────┘
```

---

## 🗄️ MODELO DE DADOS ATUAL

### Tabelas Implementadas

```sql
┌─────────────────────────────────────────────────────────────┐
│                         TENANTS                              │
├─────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                            │
│  nome            VARCHAR(255)                                │
│  slug            VARCHAR(100) UNIQUE                         │
│  logo_url        TEXT                                        │
│  primary_color   VARCHAR(7)                                  │
│  secondary_color VARCHAR(7)                                  │
│  ai_instructions TEXT (instruções para IA)                   │
│  ai_model        VARCHAR(50) DEFAULT 'gpt-4o-mini'          │
│  business_type   VARCHAR(50)                                 │
│  active          BOOLEAN DEFAULT true                        │
│  created_at      TIMESTAMP                                   │
│  updated_at      TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        USUARIOS                              │
├─────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                            │
│  tenant_id       UUID FK → tenants.id                        │
│  auth_id         UUID (link com Supabase Auth)               │
│  nome            VARCHAR(255)                                │
│  email           VARCHAR(255) UNIQUE                         │
│  telefone        VARCHAR(20)                                 │
│  role            ENUM('admin', 'gerente', 'operador')       │
│  ativo           BOOLEAN DEFAULT true                        │
│  created_at      TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         MARCAS                               │
├─────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                            │
│  tenant_id       UUID FK → tenants.id                        │
│  nome            VARCHAR(255)                                │
│  emoji           VARCHAR(10)                                 │
│  cor             VARCHAR(7)                                  │
│  descricao       TEXT                                        │
│  investimento_minimo  DECIMAL                                │
│  investimento_maximo  DECIMAL                                │
│  score_config    JSONB (parâmetros de qualificação IA)      │
│  ordem           INTEGER                                     │
│  ativo           BOOLEAN DEFAULT true                        │
│  created_at      TIMESTAMP                                   │
│  updated_at      TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                          LEADS                               │
├─────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                            │
│  tenant_id       UUID FK → tenants.id                        │
│  marca_id        UUID FK → marcas.id                         │
│  nome            VARCHAR(255)                                │
│  email           VARCHAR(255)                                │
│  telefone        VARCHAR(20)                                 │
│  capital_disponivel  DECIMAL                                 │
│  cidade          VARCHAR(100)                                │
│  estado          VARCHAR(2)                                  │
│  fonte           VARCHAR(50)                                 │
│  mensagem_original TEXT                                      │
│  score           INTEGER (0-100)                             │
│  categoria       ENUM('hot', 'warm', 'cold')                │
│  status          ENUM('novo', 'contato', 'agendado',        │
│                       'negociacao', 'convertido', 'perdido')│
│  ia_justificativa TEXT                                       │
│  ia_analise      JSONB                                       │
│  observacao      TEXT                                        │
│  created_at      TIMESTAMP                                   │
│  updated_at      TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ 1:N
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       INTERACOES                             │
├─────────────────────────────────────────────────────────────┤
│  id              UUID PRIMARY KEY                            │
│  tenant_id       UUID FK → tenants.id                        │
│  lead_id         UUID FK → leads.id                          │
│  usuario_id      UUID FK → usuarios.id                       │
│  tipo            VARCHAR(50) ('nota', 'ligacao', 'email',   │
│                               'whatsapp', 'status_change')  │
│  descricao       TEXT                                        │
│  created_at      TIMESTAMP                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 SISTEMA DE AUTENTICAÇÃO

### Fluxo Atual

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Tela Login    │────▶│  Supabase Auth  │────▶│ Tabela usuarios │
│  (email/senha)  │     │  (valida login) │     │ (busca por      │
│                 │     │                 │     │  auth_id)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │  Carrega Tenant │
                                                │  + Permissões   │
                                                └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │   Dashboard     │
                                                └─────────────────┘
```

### Níveis de Acesso Implementados

| Role | Dashboard | Leads | Marcas | Usuários | Relatórios | Config |
|------|-----------|-------|--------|----------|------------|--------|
| 👑 Admin | ✅ Ver | ✅ CRUD | ✅ CRUD | ✅ CRUD | ✅ Export | ✅ |
| 📊 Gerente | ✅ Ver | ✅ Editar | ✅ Editar | ✅ Ver | ✅ Export | ❌ |
| 👤 Operador | ✅ Ver | ✅ Editar | ✅ Ver | ❌ | ✅ Ver | ❌ |

---

## 🖥️ ESTRUTURA DO FRONTEND

### Páginas Implementadas

```
src/
├── App.jsx                 # Componente principal (tudo em um arquivo)
│   ├── AuthProvider        # Contexto de autenticação
│   ├── LoginPage           # Tela de login
│   ├── Sidebar             # Menu lateral
│   ├── Header              # Cabeçalho com info do usuário
│   ├── DashboardPage       # Métricas + Lista de leads
│   ├── LeadDetailModal     # Modal de detalhes do lead
│   ├── RelatoriosPage      # Gráficos + Export CSV
│   ├── MarcasPage          # CRUD de marcas
│   ├── UsuariosPage        # CRUD de usuários (admin)
│   └── ConfigPage          # Configurações (em desenvolvimento)
│
├── lib/
│   └── supabase.js         # Cliente Supabase
│
└── public/
    ├── logo-sistema.png    # Logo do LeadCapture Pro
    └── logo-cliente.png    # Logo do cliente/tenant
```

### Componentes e Hooks

```javascript
// HOOKS DE DADOS (React Query)
useLeads()           // Lista leads do tenant
useMetrics()         // Métricas agregadas
useUpdateLead()      // Atualiza lead
useMarcas()          // Lista marcas
useCreateMarca()     // Cria marca
useUpdateMarca()     // Atualiza marca
useUsuarios()        // Lista usuários
useCreateUsuario()   // Cria usuário
useUpdateUsuario()   // Atualiza usuário
useInteracoes()      // Histórico do lead
useCreateInteracao() // Adiciona interação

// HOOK DE AUTH
useAuth()            // Retorna: usuario, tenant, login, logout, isAdmin, hasPermission
```

---

## 🎨 DESIGN SYSTEM

### Cores Principais

```css
/* Fundo */
--bg-primary: #0a0a0b;
--bg-secondary: #12121a;
--bg-tertiary: #1f1f23;

/* Bordas */
--border-primary: #1f1f23;
--border-secondary: #2a2a2f;

/* Texto */
--text-primary: #f5f5f4;
--text-secondary: #8a8a8f;
--text-muted: #4a4a4f;

/* Accent */
--accent-primary: #ee7b4d;
--accent-secondary: #d4663a;

/* Status */
--status-hot: #ee7b4d;
--status-warm: #60a5fa;
--status-cold: #6a6a6f;
--status-success: #4ade80;
--status-error: #ef4444;
```

### Especificações de Logo

| Arquivo | Tamanho | Formato | Uso |
|---------|---------|---------|-----|
| logo-sistema.png | 200x200px | PNG transparente | Login, Sidebar, Header |
| logo-cliente.png | 200x200px | PNG transparente | Rodapé Sidebar |

---

## 📡 APIs E INTEGRAÇÕES

### Supabase (Ativo)

```javascript
// Configuração
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Operações disponíveis
supabase.auth.signInWithPassword()  // Login
supabase.auth.signOut()             // Logout
supabase.from('tabela').select()    // Leitura
supabase.from('tabela').insert()    // Criação
supabase.from('tabela').update()    // Atualização
supabase.from('tabela').delete()    // Exclusão
```

### n8n (Pendente)

```
Webhook URL: http://localhost:5678/webhook/lead-capture
Método: POST
Payload esperado:
{
  "tenant_slug": "franqueadora",
  "marca_id": "uuid",
  "nome": "string",
  "email": "string",
  "telefone": "string",
  "capital_disponivel": number,
  "cidade": "string",
  "estado": "string",
  "fonte": "string",
  "mensagem": "string"
}
```

---

## 🚀 PRÓXIMOS PASSOS (Roadmap)

### Fase 1 - Imediato (Próxima Sessão)
- [ ] Configurar n8n com workflow de qualificação
- [ ] Integrar OpenAI para score dinâmico por marca
- [ ] Testar fluxo completo de captação

### Fase 2 - Curto Prazo
- [ ] Reativar RLS com políticas corrigidas
- [ ] Implementar criação de usuário com senha integrada
- [ ] Adicionar notificações WhatsApp (Twilio)

### Fase 3 - Médio Prazo
- [ ] Página de configurações do tenant
- [ ] Upload de logos via Supabase Storage
- [ ] Dashboard com gráficos avançados (Chart.js)
- [ ] Exportação de relatórios em PDF

### Fase 4 - Futuro
- [ ] Multi-idioma
- [ ] PWA (App mobile)
- [ ] Integração com CRMs externos
- [ ] API pública para integrações

---

## 📁 ARQUIVOS DO PROJETO

### Entregáveis Atuais

```
SPRINT_COMPLETO/
├── 01_DATABASE/
│   ├── 01_mega_migration.sql       # Schema completo
│   └── 02_criar_usuario_admin.sql  # Script de setup
│
├── 02_FRONTEND/
│   ├── App.jsx                     # Código completo
│   └── .env.example                # Template de variáveis
│
├── 03_N8N/
│   └── workflow_qualificacao_v2.json  # Workflow (não testado)
│
├── CHECKLIST_MASTER.md
├── FLUXOGRAMA_SISTEMA.md
├── PASSO_A_PASSO.md
└── README.md
```

---

## 🔧 VARIÁVEIS DE AMBIENTE

```env
# Frontend (.env)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-anon-key

# n8n (quando configurar)
OPENAI_API_KEY=sk-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
```

---

## 📝 DECISÕES TÉCNICAS IMPORTANTES

### 1. RLS Desabilitado Temporariamente
**Motivo:** Recursão infinita nas políticas de `usuarios`
**Solução aplicada:** Subquery direta em vez de função
**Status:** Funcional, mas RLS desligado para garantir funcionamento

### 2. Autenticação em Dois Lugares
**Motivo:** Supabase Auth gerencia credenciais, tabela `usuarios` gerencia dados do sistema
**Fluxo:** Criar no Auth → Vincular auth_id na tabela usuarios

### 3. App.jsx Monolítico
**Motivo:** Simplificar desenvolvimento e debug
**Futuro:** Pode ser dividido em arquivos separados quando estabilizar

### 4. React Query para Estado
**Motivo:** Cache automático, invalidação inteligente, loading states
**Benefício:** Menos código, melhor UX

---

## 📞 INFORMAÇÕES DO PROJETO

| Item | Valor |
|------|-------|
| **Projeto** | LeadCapture Pro |
| **Versão** | 2.0 |
| **Desenvolvedor** | Juliana Zafalão |
| **Tech Lead** | Claude (Anthropic) |
| **Início** | Janeiro 2026 |
| **Status** | Em Desenvolvimento (78%) |

---

## 📋 CHANGELOG

### v2.0 (31/01/2026)
- ✅ Migração completa para Supabase Auth
- ✅ Sistema de permissões por role
- ✅ CRUD completo de leads, marcas e usuários
- ✅ Histórico de interações
- ✅ Export CSV
- ✅ Sistema de logos em PNG
- ⏸️ RLS temporariamente desabilitado
- ⏳ n8n pendente de configuração

### v1.0 (Anterior)
- Dashboard básico com dados hardcoded
- Sem autenticação real
- Sem multi-tenant

---

*Documento atualizado em 31/01/2026 às 22:00*
*LeadCapture Pro - Sistema de Qualificação de Leads*

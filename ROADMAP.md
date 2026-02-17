# 🗺️ ROADMAP - LeadCapture Pro

## ✅ CONCLUÍDO

### V1.0 - Base Funcional
- [x] Backend API (Node.js + Express)
- [x] Integração Supabase (SERVICE_KEY)
- [x] Landing Page Lava Lava
- [x] Formulário de captação funcionando
- [x] Validações básicas
- [x] Máscaras (telefone, capital)
- [x] Cálculo de score e categoria
- [x] Código limpo (-35% linhas)

---

## 🔄 EM ANDAMENTO

### V1.2 - OP1: Melhorias no Formulário

#### 1. Campo Observação
- [ ] Remover campo "Mensagem/Observação" da landing page
- [ ] Observação deve ser editado SOMENTE no admin (frontend)
- [ ] Ajustar backend para não exigir observação na captação

#### 2. Campo CPF ou CNPJ
- [ ] Adicionar campo "CPF ou CNPJ" no formulário
- [ ] Máscara automática (CPF: 000.000.000-00 | CNPJ: 00.000.000/0000-00)
- [ ] Validação de CPF e CNPJ
- [ ] Campo obrigatório
- [ ] Salvar no banco (adicionar coluna se necessário)

#### 3. Google Analytics
- [ ] Criar conta Google Analytics
- [ ] Adicionar tracking code na landing
- [ ] Rastrear eventos:
  - Visualização da página
  - Scroll (25%, 50%, 75%, 100%)
  - Clique em CTA
  - Envio de formulário (conversão)
  - Erro no formulário

---

## 📅 PLANEJADO

### V1.3 - OP2: Mais Landing Pages

#### Landing Page PowerGym
- [ ] Criar pasta `landing-powergym`
- [ ] Adaptar cores/tema (fitness/gym)
- [ ] Configurar IDs:
  - tenant_id: 81cac3a4-... (Franqueadora)
  - marca_id: bc2fbc8b-... (PowerGym)
  - fonte: landing-page
- [ ] Assets (logos, imagens)
- [ ] Testar captação

#### Landing Page ABC Escola Infantil
- [ ] Criar pasta `landing-abc-escola`
- [ ] Adaptar cores/tema (educação infantil)
- [ ] Configurar IDs:
  - tenant_id: 81cac3a4-... (Franqueadora)
  - marca_id: 11111111-... (ABC Escola)
  - fonte: landing-page
- [ ] Assets (logos, imagens)
- [ ] Testar captação

#### Template Genérico
- [ ] Criar template reutilizável
- [ ] Variáveis configuráveis:
  - Nome da marca
  - Cores (primária, secundária)
  - Logos
  - Textos
  - IDs (tenant, marca)
- [ ] Script de geração automática
- [ ] Documentação de uso

---

### V1.4 - OP3: Funcionalidades Backend

#### Notificação Email
- [ ] Integrar serviço de email (SendGrid, AWS SES, Resend)
- [ ] Template de email para novo lead
- [ ] Enviar para email do responsável da marca
- [ ] Log de emails enviados
- [ ] Retry em caso de falha

#### Notificação WhatsApp
- [ ] Integrar Twilio (já tem credenciais no .env)
- [ ] Template de mensagem WhatsApp
- [ ] Enviar para número do responsável
- [ ] Log de mensagens enviadas

#### Dashboard Tempo Real
- [ ] WebSocket/Server-Sent Events
- [ ] Notificação em tempo real no admin
- [ ] Som de alerta para novo lead
- [ ] Badge com contador

#### Relatórios e Estatísticas
- [ ] Leads por marca
- [ ] Leads por fonte
- [ ] Taxa de conversão
- [ ] Score médio
- [ ] Gráficos (Chart.js)
- [ ] Exportar para Excel/CSV

---

### V1.5 - OP4: Integração Admin

#### Ver Leads da Landing no Admin
- [ ] Filtro por fonte "landing-page"
- [ ] Badge visual para leads da landing
- [ ] Dados específicos da captação

#### Filtros Avançados
- [ ] Filtro por marca
- [ ] Filtro por fonte
- [ ] Filtro por período
- [ ] Filtro por score
- [ ] Filtro por categoria

#### Dashboard por Marca
- [ ] Página específica para cada marca
- [ ] Estatísticas individuais
- [ ] Funil de conversão
- [ ] Performance da landing page

---

### V1.6 - OP5: Deploy e Produção

#### Preparação
- [ ] Ambiente de staging
- [ ] Testes de carga
- [ ] Otimização de assets
- [ ] Minificação de JS/CSS
- [ ] Compressão de imagens

#### Infraestrutura
- [ ] Servidor (DigitalOcean, AWS, Vercel)
- [ ] Banco de dados (Supabase produção)
- [ ] Redis (cache)
- [ ] CDN (Cloudflare)

#### Domínio e SSL
- [ ] Registrar domínio
- [ ] Configurar DNS
- [ ] Certificado SSL (Let's Encrypt)
- [ ] HTTPS forçado

#### Monitoramento
- [ ] Logs (Winston, Pino)
- [ ] Alertas (Sentry)
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Analytics (Google Analytics, Plausible)

---

### V1.7 - Formulário Google

#### Integração Google Forms
- [ ] Retomar desenvolvimento do formulário Google
- [ ] Mapear campos do Google Forms → Supabase
- [ ] Webhook/API do Google Forms
- [ ] Sincronização automática
- [ ] Deduplicação de leads
- [ ] Testes de integração

---

## 🎯 MÉTRICAS DE SUCESSO

- **Performance:** < 2s carregamento da landing
- **Conversão:** > 5% visitantes → leads
- **Disponibilidade:** 99.9% uptime
- **Qualidade:** Score médio > 60
- **Resposta:** < 24h para contato com lead

---

## 📝 OBSERVAÇÕES

- Commits frequentes a cada funcionalidade
- Testes antes de cada merge
- Documentação atualizada
- Code review quando possível
- Backup diário do banco


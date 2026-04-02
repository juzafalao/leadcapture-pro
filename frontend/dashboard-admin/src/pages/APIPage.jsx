// APIPage.jsx — Documentação da API Pública
import { useState } from 'react'
import { motion } from 'framer-motion'

const BASE_URL = 'https://leadcapture-proprod.vercel.app'

const ENDPOINTS = [
  {
    grupo: 'Leads',
    cor: '#10B981',
    rotas: [
      {
        method: 'POST', path: '/api/leads',
        desc: 'Captura um novo lead via landing page ou integração externa',
        auth: false,
        body: {
          tenant_id: 'uuid — ID do tenant (obrigatório)',
          nome: 'string — Nome completo do lead',
          email: 'string — E-mail válido',
          telefone: 'string — Telefone com DDD',
          capital_disponivel: 'number ou string — Capital em R$ ou chave do mapa',
          id_marca: 'uuid — ID da marca de interesse',
          fonte: 'string — Origem do lead (ex: landing-page)',
          regiao_interesse: 'string — Cidade/Estado de interesse',
        },
        response: { success: true, leadId: 'uuid', score: 80, categoria: 'hot' },
      },
      {
        method: 'POST', path: '/api/leads/google-forms',
        desc: 'Recebe leads via Google Forms (webhook)',
        auth: false,
        body: {
          tenant_id: 'uuid',
          marca_id: 'uuid',
          nome: 'string',
          email: 'string',
          telefone: 'string',
          capital: 'string — ex: "100k-300k"',
        },
        response: { success: true, leadId: 'uuid', score: 75, duplicado: false },
      },
    ]
  },
  {
    grupo: 'Marcas',
    cor: '#3B82F6',
    rotas: [
      {
        method: 'GET', path: '/api/marcas/slug/:slug',
        desc: 'Busca os dados de uma marca pelo slug da landing page',
        auth: false,
        body: null,
        response: { marca: { id: 'uuid', nome: 'Lava Lava', emoji: '🚗', tenant_id: 'uuid', slug: 'lava-lava', meta_pixel_id: '...', google_ads_conversion_id: '...' } },
      },
    ]
  },
  {
    grupo: 'Chatbot IA',
    cor: '#8B5CF6',
    rotas: [
      {
        method: 'POST', path: '/api/chat/message',
        desc: 'Envia mensagem para o chatbot IA do tenant',
        auth: false,
        body: {
          message: 'string — Pergunta do usuário',
          tenant_id: 'uuid — Tenant para buscar instruções de IA',
          historico: 'array — Histórico da conversa',
        },
        response: { success: true, resposta: 'string — Resposta da IA em JSON estruturado' },
      },
      {
        method: 'GET', path: '/api/chat/health',
        desc: 'Verifica se a IA está configurada e operacional',
        auth: false,
        body: null,
        response: { status: 'ok', anthropic_configured: true },
      },
    ]
  },
  {
    grupo: 'WhatsApp',
    cor: '#25D366',
    rotas: [
      {
        method: 'POST', path: '/api/whatsapp/webhook',
        desc: 'Recebe mensagens da Evolution API (webhook)',
        auth: false,
        body: { event: 'messages.upsert', data: { message: { conversation: 'string' }, key: { remoteJid: 'string' } } },
        response: { received: true },
      },
      {
        method: 'GET', path: '/api/whatsapp/status',
        desc: 'Verifica status da integração WhatsApp',
        auth: false,
        body: null,
        response: { success: true, configured: true, instance: 'lead-pro', webhook_url: 'string' },
      },
    ]
  },
  {
    grupo: 'Health',
    cor: '#F59E0B',
    rotas: [
      {
        method: 'GET', path: '/health',
        desc: 'Health check geral do sistema',
        auth: false,
        body: null,
        response: { status: 'ok', service: 'LeadCapture Pro', version: '1.9.0', timestamp: 'ISO8601' },
      },
    ]
  },
]

const METHOD_COR = { GET:'#10B981', POST:'#3B82F6', PUT:'#F59E0B', DELETE:'#EF4444' }

function EndpointCard({ rota }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="bg-[#0B1220] border border-white/5 rounded-xl overflow-hidden mb-2">
      <button
        onClick={() => setAberto(a => !a)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/2 transition-all text-left"
      >
        <span className="px-2 py-0.5 rounded text-[10px] font-black min-w-[44px] text-center"
          style={{ background:`${METHOD_COR[rota.method]}20`, color:METHOD_COR[rota.method] }}>
          {rota.method}
        </span>
        <code className="text-sm text-gray-300 font-mono">{rota.path}</code>
        <span className="text-xs text-gray-600 flex-1 hidden md:block">{rota.desc}</span>
        <span className="text-gray-600 text-xs">{aberto ? '▲' : '▼'}</span>
      </button>

      {aberto && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="px-4 pb-4 border-t border-white/5">
          <p className="text-xs text-gray-500 mt-3 mb-3">{rota.desc}</p>

          {rota.body && (
            <div className="mb-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-2">Request Body</p>
              <div className="bg-[#060d1a] rounded-lg p-3 font-mono text-xs">
                {Object.entries(rota.body).map(([k,v]) => (
                  <div key={k} className="flex gap-2">
                    <span className="text-[#10B981]">{k}</span>
                    <span className="text-gray-500">—</span>
                    <span className="text-gray-400">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-600 mb-2">Response</p>
            <pre className="bg-[#060d1a] rounded-lg p-3 text-xs text-[#10B981] overflow-x-auto">
              {JSON.stringify(rota.response, null, 2)}
            </pre>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <span className="text-[10px] text-gray-600">Base URL:</span>
            <code className="text-[10px] text-gray-400 font-mono">{BASE_URL}{rota.path}</code>
            <button
              onClick={() => navigator.clipboard?.writeText(`${BASE_URL}${rota.path}`)}
              className="text-[10px] text-[#10B981] hover:underline"
            >
              copiar
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}

export default function APIPage() {
  return (
    <div className="min-h-screen bg-[#0B1220] pb-16">
      <div className="px-6 lg:px-10 pt-8 pb-6">
        <motion.div initial={{ opacity:0, y:-12 }} animate={{ opacity:1, y:0 }}>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl lg:text-3xl font-light text-white">
              API <span className="text-[#10B981] font-bold">Pública</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20">
              v1.9 — Ativa
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-0.5 bg-[#10B981] rounded-full" />
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">
              Documentação de referência — LeadCapture Pro API
            </p>
          </div>
        </motion.div>
      </div>

      {/* Info geral */}
      <div className="px-6 lg:px-10 mb-8">
        <div className="bg-[#0F172A] border border-white/5 rounded-2xl p-5 flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Base URL</p>
            <code className="text-sm text-[#10B981] font-mono">{BASE_URL}</code>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Autenticação</p>
            <p className="text-sm text-gray-400">Endpoints públicos não requerem auth. Endpoints administrativos via Supabase JWT.</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Rate Limiting</p>
            <p className="text-sm text-gray-400">100 req/15min global · 30 req/min para captura de leads</p>
          </div>
          <div className="flex-1">
            <p className="text-xs font-black uppercase tracking-wider text-gray-500 mb-2">Formato</p>
            <p className="text-sm text-gray-400">JSON · Content-Type: application/json · UTF-8</p>
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div className="px-6 lg:px-10">
        {ENDPOINTS.map((grupo, gi) => (
          <motion.div key={grupo.grupo} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:gi*0.08}} className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full" style={{background:grupo.cor}} />
              <h2 className="text-sm font-black uppercase tracking-wider" style={{color:grupo.cor}}>
                {grupo.grupo}
              </h2>
              <span className="text-[10px] text-gray-600">{grupo.rotas.length} endpoint{grupo.rotas.length > 1 ? 's' : ''}</span>
            </div>
            {grupo.rotas.map((rota, ri) => (
              <EndpointCard key={ri} rota={rota} />
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

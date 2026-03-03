// ============================================================
// WhatsAppSetup.jsx — Configuração de Integração WhatsApp
// LeadCapture Pro — Zafalão Tech
// ============================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const StatusBadge = ({ conectado }) => (
  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${conectado ? 'bg-[#10B981]/20 text-[#10B981]' : 'bg-red-500/20 text-red-400'}`}>
    <span className={`w-2 h-2 rounded-full ${conectado ? 'bg-[#10B981]' : 'bg-red-400'}`} />
    {conectado ? 'Conectado' : 'Desconectado'}
  </span>
);

export default function WhatsAppSetup() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    apiUrl: '',
    apiKey: '',
    instance: 'lead-pro',
  });
  const [saved, setSaved] = useState(false);

  const handleVerify = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/comunicacao/whatsapp/status', {
        headers: { 'x-api-key': form.apiKey },
      });
      const data = await res.json();
      setStatus(data);
    } catch {
      setStatus({ conectado: false, motivo: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">Integração WhatsApp</h3>
          <p className="text-sm text-[#94A3B8] mt-0.5">
            Configure a Evolution API para envio de mensagens automatizadas
          </p>
        </div>
        {status && <StatusBadge conectado={status.conectado} />}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
            URL da Evolution API
          </label>
          <input
            type="url"
            value={form.apiUrl}
            onChange={(e) => setForm(f => ({ ...f, apiUrl: e.target.value }))}
            placeholder="http://localhost:8080"
            className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
            API Key
          </label>
          <input
            type="password"
            value={form.apiKey}
            onChange={(e) => setForm(f => ({ ...f, apiKey: e.target.value }))}
            placeholder="••••••••••••••••"
            className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]/50 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">
            Nome da Instância
          </label>
          <input
            type="text"
            value={form.instance}
            onChange={(e) => setForm(f => ({ ...f, instance: e.target.value }))}
            placeholder="lead-pro"
            className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]/50 text-sm"
          />
        </div>

        {/* Status info */}
        {status && !status.conectado && (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
            <span>⚠️</span>
            <span>{status.motivo || 'Não foi possível conectar'}</span>
          </div>
        )}
        {status?.conectado && (
          <div className="flex items-start gap-2 p-3 bg-[#10B981]/10 border border-[#10B981]/20 rounded-xl text-sm text-[#10B981]">
            <span>✅</span>
            <span>
              Instância <strong>{status.instancia}</strong> — Status: {status.status}
            </span>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={handleVerify}
            disabled={loading || !form.apiKey}
            className="px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-sm text-white hover:bg-[#2D3748] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Verificando...' : '🔍 Testar Conexão'}
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-semibold transition-colors"
          >
            {saved ? '✅ Salvo!' : '💾 Salvar'}
          </button>
        </div>
      </form>

      {/* Templates info */}
      <div className="border-t border-white/5 pt-5">
        <h4 className="text-sm font-semibold text-white mb-3">Templates Disponíveis</h4>
        <div className="space-y-2">
          {[
            { key: 'boas_vindas', label: 'Boas-vindas', desc: 'Enviado automaticamente ao novo lead' },
            { key: 'followup', label: 'Follow-up 48h', desc: 'Reengajamento após 48h sem resposta' },
            { key: 'hot_lead', label: 'Alerta Lead Quente', desc: 'Notifica o gestor quando score ≥ 70' },
          ].map(t => (
            <div key={t.key} className="flex items-start gap-3 p-3 bg-[#1E293B]/60 rounded-xl">
              <span className="text-[#10B981] mt-0.5">📋</span>
              <div>
                <p className="text-sm font-medium text-white">{t.label}</p>
                <p className="text-xs text-[#64748B]">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// LandingEditorPage.jsx — Editor Visual de Landing Pages
// LeadCapture Pro — Zafalão Tech
// ============================================================

import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useAuth } from '../components/AuthContext';
import LandingPreview from '../components/landing/LandingPreview';
import LandingFieldEditor from '../components/landing/LandingFieldEditor';

const DEFAULT_CONFIG = {
  titulo: 'Cadastre-se e garanta sua vaga!',
  subtitulo: 'Preencha o formulário abaixo e um consultor entrará em contato.',
  cta: 'Quero saber mais',
  corPrimaria: '#10B981',
  bgColor: '#0F172A',
  logoUrl: '',
  fields: [
    { label: 'Nome completo', type: 'text', placeholder: 'Seu nome', required: true },
    { label: 'E-mail', type: 'email', placeholder: 'seu@email.com', required: true },
    { label: 'Telefone', type: 'tel', placeholder: '(11) 99999-9999', required: true },
  ],
};

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? 'bg-[#10B981]/20 text-[#10B981]'
          : 'text-[#64748B] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

export default function LandingEditorPage() {
  const { tenant } = useAuth();
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [tab, setTab] = useState('design');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [slug, setSlug] = useState('');

  const updateConfig = useCallback((key, value) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!tenant?.id) return;
    setSaving(true);
    try {
      const payload = {
        tenant_id: tenant.id,
        slug: slug || `landing-${Date.now()}`,
        config,
        ativo: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('landing_pages')
        .upsert(payload, { onConflict: 'tenant_id,slug' });

      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('[LandingEditor] Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="min-h-screen bg-[#0B1220] text-white pb-16"
    >
      {/* Header */}
      <div className="px-4 lg:px-10 pt-6 lg:pt-8 mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Editor de Landing Page</h1>
          <p className="text-sm text-[#64748B] mt-1">Personalize e publique sua landing page de captura</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            placeholder="slug-da-pagina"
            className="px-4 py-2 bg-[#1E293B] border border-white/10 rounded-xl text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#10B981]/50 w-44"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 bg-[#10B981] hover:bg-[#059669] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {saving ? '⏳ Salvando...' : saved ? '✅ Salvo!' : '💾 Publicar'}
          </button>
        </div>
      </div>

      <div className="px-4 lg:px-10 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-[#1E293B]/50 p-1 rounded-xl w-fit">
            <TabButton active={tab === 'design'} onClick={() => setTab('design')}>🎨 Design</TabButton>
            <TabButton active={tab === 'campos'} onClick={() => setTab('campos')}>📋 Campos</TabButton>
          </div>

          {tab === 'design' && (
            <div className="bg-[#0F172A] rounded-3xl border border-white/5 p-6 space-y-4">
              <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider">Conteúdo</h3>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Título principal</label>
                <input
                  type="text"
                  value={config.titulo}
                  onChange={(e) => updateConfig('titulo', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Subtítulo</label>
                <textarea
                  value={config.subtitulo}
                  onChange={(e) => updateConfig('subtitulo', e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Texto do botão</label>
                <input
                  type="text"
                  value={config.cta}
                  onChange={(e) => updateConfig('cta', e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Cor principal</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.corPrimaria}
                      onChange={(e) => updateConfig('corPrimaria', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-[#64748B]">{config.corPrimaria}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">Cor de fundo</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.bgColor}
                      onChange={(e) => updateConfig('bgColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-white/10 cursor-pointer bg-transparent"
                    />
                    <span className="text-sm text-[#64748B]">{config.bgColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#94A3B8] mb-1.5">URL do Logo</label>
                <input
                  type="url"
                  value={config.logoUrl}
                  onChange={(e) => updateConfig('logoUrl', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 bg-[#1E293B] border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#10B981]/50 placeholder-[#475569]"
                />
              </div>
            </div>
          )}

          {tab === 'campos' && (
            <div className="bg-[#0F172A] rounded-3xl border border-white/5 p-6">
              <LandingFieldEditor
                fields={config.fields}
                onChange={(fields) => updateConfig('fields', fields)}
              />
            </div>
          )}
        </div>

        {/* Preview Panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">Preview</span>
            <span className="text-xs text-[#475569]">— Atualizado em tempo real</span>
          </div>
          <LandingPreview config={config} />
          {slug && (
            <div className="flex items-center gap-2 p-3 bg-[#1E293B]/60 rounded-xl text-sm">
              <span className="text-[#64748B]">URL pública:</span>
              <code className="text-[#10B981]">/landing/{slug || 'slug-da-pagina'}</code>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

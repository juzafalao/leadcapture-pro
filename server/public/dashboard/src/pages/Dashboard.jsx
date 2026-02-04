import React, { useState, useEffect } from 'react';
import { LeadCard } from '../components/leads/LeadCard';
// Certifique-se de que o caminho do seu supabaseClient está correto
// import { supabase } from '../lib/supabaseClient'; 

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Configurações visuais (Mantenha as que você já usa no index.jsx)
  const statusConfig = { novo: { label: 'Novo', color: 'blue', icon: '✨' }, /* ... */ };
  const categoriaConfig = { hot: { label: 'Hot', color: 'from-red-600 to-orange-600', icon: '🔥' }, /* ... */ };
  const fonteConfig = { whatsapp: { label: 'WhatsApp', icon: '📱' }, /* ... */ };

  // Ação de WhatsApp (P1: Agilidade Comercial)
  const handleWhatsApp = (lead) => {
    const message = encodeURIComponent(`Olá ${lead.nome}, recebemos seu interesse na LeadCapture Pro! Podemos conversar?`);
    window.open(`https://wa.me/${lead.telefone.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-gray-950 text-gray-100 overflow-hidden">
      
      {/* BOTÃO HAMBÚRGUER (Mobile) */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-orange-600 text-white rounded-lg shadow-xl"
      >
        {sidebarOpen ? '✕' : '☰'}
      </button>

      {/* OVERLAY (Fecha o menu ao clicar fora no mobile) */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-30 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* SIDEBAR RESPONSIVA */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-40 w-64 bg-gray-900 border-r border-gray-800
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6">
          <h1 className="text-xl font-bold text-orange-500">LeadCapture Pro</h1>
          <nav className="mt-8 space-y-2">
            {/* Seus links de navegação aqui */}
            <a href="#" className="block p-3 bg-gray-800 rounded-lg text-orange-400">Dashboard</a>
          </nav>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 pt-20 md:pt-8">
        <header className="mb-8">
          <h2 className="text-2xl font-bold">Gestão de Leads</h2>
          <p className="text-gray-400">Acompanhe a qualificação em tempo real</p>
        </header>

        {/* LISTA DE LEADS: SWITCH RESPONSIVO */}
        <section>
          {/* DESKTOP: TABELA (Oculta no mobile) */}
          <div className="hidden md:block bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-800/50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="p-4">Lead</th>
                  <th className="p-4">Categoria</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {/* Loop da tabela aqui usando seu código original */}
              </tbody>
            </table>
          </div>

          {/* MOBILE: CARDS (Oculta no desktop) */}
          <div className="md:hidden space-y-4">
            {leads.map(lead => (
              <LeadCard 
                key={lead.id} 
                lead={lead} 
                onWhatsApp={handleWhatsApp}
                onClick={(l) => console.log('Ver detalhes', l)}
                statusConfig={statusConfig}
                categoriaConfig={categoriaConfig}
                fonteConfig={fonteConfig}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
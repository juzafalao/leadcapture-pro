import React from 'react';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0b]">
      
      {/* Header da Página */}
      <div className="bg-gradient-to-b from-[#0a0a0b] to-[#12121a] border-b border-[#1f1f23] px-4 lg:px-8 py-8 lg:py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl lg:text-5xl font-light text-white mb-2">
            Dashboard
          </h1>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-4 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Seu conteúdo atual aqui */}
          <p className="text-gray-400">Seu conteúdo do dashboard...</p>
        </div>
      </div>
    </div>
  );
}
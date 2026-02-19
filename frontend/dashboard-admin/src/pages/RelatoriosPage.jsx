import React from 'react';

export default function RelatoriosPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">📊 Relatórios</h1>
        <p className="text-gray-600 mt-1">Análises e métricas do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* KPIs */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Leads</p>
              <p className="text-3xl font-bold text-blue-600">0</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Taxa de Conversão</p>
              <p className="text-3xl font-bold text-green-600">0%</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Leads Quentes</p>
              <p className="text-3xl font-bold text-orange-600">0</p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Franquias Ativas</p>
              <p className="text-3xl font-bold text-purple-600">0</p>
            </div>
            <div className="text-4xl">🏢</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">📋 Relatórios Disponíveis</h2>
        
        <div className="space-y-4">
          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">📊 Leads por Período</h3>
            <p className="text-sm text-gray-600">Visualize a evolução de leads ao longo do tempo</p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">🎯 Performance por Franquia</h3>
            <p className="text-sm text-gray-600">Compare o desempenho entre franquias</p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">📍 Origem dos Leads</h3>
            <p className="text-sm text-gray-600">Veja de onde vêm seus leads</p>
          </div>

          <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
            <h3 className="font-semibold">💰 Funil de Conversão</h3>
            <p className="text-sm text-gray-600">Analise o funil de vendas completo</p>
          </div>
        </div>

        <div className="mt-6 text-center text-gray-500">
          <p>🚧 Em desenvolvimento - Relatórios completos em breve</p>
        </div>
      </div>
    </div>
  );
}

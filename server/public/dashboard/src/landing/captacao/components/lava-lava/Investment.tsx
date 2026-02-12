import React from 'react';

export const Investment: React.FC = () => {
  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold mb-8">Investimento</h2>
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-2xl mx-auto">
          <p className="text-3xl font-bold text-blue-600 mb-4">A partir de R$ 150.000</p>
          <ul className="text-left space-y-2 text-gray-700">
            <li>✅ Taxa de franquia</li>
            <li>✅ Equipamentos completos</li>
            <li>✅ Treinamento inicial</li>
            <li>✅ Marketing de abertura</li>
          </ul>
        </div>
      </div>
    </section>
  );
};

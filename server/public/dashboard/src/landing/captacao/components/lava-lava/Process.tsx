import React from 'react';

export const Process: React.FC = () => {
  const steps = [
    '1. Preencha o formulário',
    '2. Análise do perfil',
    '3. Apresentação do negócio',
    '4. Assinatura do contrato',
    '5. Inauguração da unidade',
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Como Funciona</h2>
        <div className="max-w-3xl mx-auto">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center mb-6">
              <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold mr-4">
                {idx + 1}
              </div>
              <p className="text-xl text-gray-700">{step}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

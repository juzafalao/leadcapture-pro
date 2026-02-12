import React from 'react';

export const Benefits: React.FC = () => {
  const benefits = [
    { title: 'Marca Consolidada', desc: '15 anos de mercado' },
    { title: 'Suporte Completo', desc: 'Treinamento e operação' },
    { title: 'Retorno Rápido', desc: 'ROI em até 24 meses' },
    { title: 'Exclusividade', desc: 'Território protegido' },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">Por Que Escolher a Lava Lava?</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((item, idx) => (
            <div key={idx} className="text-center p-6 bg-blue-50 rounded-lg">
              <h3 className="text-xl font-bold text-blue-600 mb-2">{item.title}</h3>
              <p className="text-gray-700">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

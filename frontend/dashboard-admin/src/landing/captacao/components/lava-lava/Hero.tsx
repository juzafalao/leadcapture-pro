import React from 'react';

export const Hero: React.FC = () => {
  return (
    <section className="bg-gradient-to-b from-blue-600 to-blue-800 text-white py-20">
      <div className="container mx-auto px-4 text-center">
        <img 
          src="/landing/captacao/assets/lava-lava/logo.png" 
          alt="Lava Lava" 
          className="mx-auto mb-8 h-24"
        />
        <h1 className="text-5xl font-bold mb-6">
          Abra Sua Franquia Lava Lava
        </h1>
        <p className="text-2xl mb-8 max-w-3xl mx-auto">
          Oportunidade única de investir no mercado de lavanderias com uma marca consolidada
        </p>
        <a 
          href="#formulario" 
          className="bg-yellow-400 text-blue-900 px-8 py-4 rounded-lg text-xl font-bold hover:bg-yellow-300 transition inline-block"
        >
          Quero Saber Mais
        </a>
      </div>
    </section>
  );
};

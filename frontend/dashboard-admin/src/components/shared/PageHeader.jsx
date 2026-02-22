import React from 'react';

export default function PageHeader({ title, highlight, description }) {
  return (
    <div className="mb-12 text-left">
      <h1 className="text-4xl font-light text-white italic-none tracking-tighter leading-none mb-3">
        {title} <span className="text-[#10B981] font-black">{highlight}</span>
      </h1>
      <div className="h-[1px] w-20 bg-[#10B981] mb-3"></div> {/* Linha de detalhe opcional */}
      <p className="text-gray-600 text-[10px] font-black uppercase tracking-[0.4em]">
        {description}
      </p>
    </div>
  );
}
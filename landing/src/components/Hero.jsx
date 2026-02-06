import { useState } from 'react';

export default function Hero() {
  const [email, setEmail] = useState('');

  const handleCTA = (e) => {
    e.preventDefault();
    // Por enquanto, apenas alert
    alert(`Email capturado: ${email}`);
  };

  return (
    <section className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <div className="text-center text-white">
          {/* Tag */}
          <div className="inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-orange-400">
              🚀 IA + Automação = Mais Vendas
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Transforme Leads Frios em{' '}
            <span className="bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Clientes Qualificados
            </span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Reduza <strong>80% do tempo</strong> de qualificação.
            <br />
            Aumente <strong>3x a taxa de conversão</strong> com IA.
          </p>

          {/* CTA Form */}
          <form onSubmit={handleCTA} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto mb-8">
            <input
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1 px-6 py-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              Começar Grátis →
            </button>
          </form>

          {/* Trust Signals */}
          <div className="flex flex-wrap justify-center gap-6 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>14 dias grátis</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Sem cartão</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
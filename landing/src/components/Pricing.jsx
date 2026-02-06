import { useState } from 'react';

const plans = [
  {
    name: 'Starter',
    price: 197,
    priceYearly: 1970,
    description: 'Ideal para começar',
    features: [
      'Até 500 leads/mês',
      'Qualificação por IA',
      'WhatsApp + Email',
      'Dashboard básico',
      'Suporte por email',
    ],
    cta: 'Começar Teste Grátis',
    highlight: false,
  },
  {
    name: 'Growth',
    price: 497,
    priceYearly: 4970,
    description: 'Para equipes em crescimento',
    features: [
      'Até 2.000 leads/mês',
      'IA avançada + Score detalhado',
      'Todos os canais (WhatsApp, Email, Instagram)',
      'Analytics completo',
      'Integrações (HubSpot, RD Station)',
      'Suporte prioritário',
      'Automações customizadas',
    ],
    cta: 'Começar Teste Grátis',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: null,
    description: 'Para grandes operações',
    features: [
      'Leads ilimitados',
      'IA personalizada para seu negócio',
      'White-label (sua marca)',
      'API para integrações custom',
      'Suporte dedicado 24/7',
      'SLA garantido 99.9%',
      'Treinamento da equipe',
    ],
    cta: 'Falar com Vendas',
    highlight: false,
  },
];

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <section id="pricing" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-slate-900 mb-4">
            Preços Simples. Sem Surpresas.
          </h2>
          <p className="text-xl text-slate-600 mb-8">
            Escolha o plano ideal para o seu negócio
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-md">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'yearly'
                  ? 'bg-orange-500 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Anual
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                Economize 20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl p-8 transition-all ${
                plan.highlight
                  ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-2xl scale-105'
                  : 'bg-white border-2 border-slate-200 hover:border-orange-300 hover:shadow-lg'
              }`}
            >
              {/* Badge (só no highlight) */}
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-yellow-400 text-slate-900 px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                    ⭐ MAIS POPULAR
                  </div>
                </div>
              )}

              {/* Plan Name */}
              <h3
                className={`text-2xl font-bold mb-2 ${
                  plan.highlight ? 'text-white' : 'text-slate-900'
                }`}
              >
                {plan.name}
              </h3>

              {/* Description */}
              <p
                className={`mb-6 ${
                  plan.highlight ? 'text-orange-100' : 'text-slate-600'
                }`}
              >
                {plan.description}
              </p>

              {/* Price */}
              <div className="mb-6">
                {plan.price ? (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold">
                        R$ {billingCycle === 'monthly' ? plan.price : Math.floor(plan.priceYearly / 12)}
                      </span>
                      <span
                        className={plan.highlight ? 'text-orange-100' : 'text-slate-600'}
                      >
                        /mês
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <p
                        className={`text-sm mt-2 ${
                          plan.highlight ? 'text-orange-100' : 'text-slate-500'
                        }`}
                      >
                        Cobrado anualmente (R$ {plan.priceYearly})
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-3xl font-bold">Sob consulta</div>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => alert(`Plano selecionado: ${plan.name}`)}
                className={`block w-full text-center py-3 rounded-lg font-bold transition-all mb-8 ${
                  plan.highlight
                    ? 'bg-white text-orange-600 hover:bg-orange-50 shadow-lg'
                    : 'bg-orange-500 text-white hover:bg-orange-600'
                }`}
              >
                {plan.cta}
              </button>

              {/* Features */}
              <ul className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <svg
                      className={`w-6 h-6 flex-shrink-0 mt-0.5 ${
                        plan.highlight ? 'text-white' : 'text-green-500'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`text-sm ${plan.highlight ? 'text-white' : 'text-slate-700'}`}
                    >
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Trust Signal */}
        <div className="mt-16 text-center">
          <p className="text-slate-600 mb-4">
            🔒 Pagamento seguro • ✅ Cancele quando quiser • 💰 Teste grátis por 14 dias
          </p>
          <p className="text-sm text-slate-500">
            Junte-se a <strong>centenas de empresas</strong> que já automatizaram a qualificação de leads
          </p>
        </div>
      </div>
    </section>
  );
}
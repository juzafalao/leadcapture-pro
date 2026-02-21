import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLogging(true);

    if (!email || !password) {
      setError('Preencha todos os campos');
      setIsLogging(false);
      return;
    }

    const result = await login(email, password);

    if (!result.success) {
      if (result.error.includes('Invalid login credentials')) {
        setError('Email ou senha incorretos');
      } else {
        setError(result.error);
      }
      setIsLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <span className="text-[#10B981] font-black tracking-widest animate-pulse">CARREGANDO...</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.08) 0%, #0F172A 70%)' }}
    >
      <div className="w-full max-w-md">
        
        {/* Logo e Título */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg"
              style={{ filter: 'drop-shadow(0 0 12px rgba(16,185,129,0.5))' }}>
              <rect width="56" height="56" rx="14" fill="#0B1220"/>
              <line x1="12" y1="16" x2="44" y2="16" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
              <line x1="44" y1="16" x2="12" y2="40" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
              <line x1="12" y1="40" x2="44" y2="40" stroke="#10B981" strokeWidth="3" strokeLinecap="round"/>
              <line x1="4" y1="16" x2="10" y2="16" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
              <line x1="4" y1="28" x2="10" y2="28" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.3"/>
              <line x1="4" y1="40" x2="10" y2="40" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
            </svg>
          </div>
          <h1 className="text-3xl font-light text-[#F8FAFC] mb-2">
            LeadCapture <span className="text-[#10B981] font-bold">Pro</span>
          </h1>
          <p className="text-xs text-[#4a4a4f] tracking-wider">Acesse sua conta</p>
        </div>

        {/* Form - APENAS LINHAS */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Email */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isLogging}
              autoComplete="email"
              className="w-full bg-transparent border-b-2 border-[#10B981] px-0 py-3 text-[#F8FAFC] placeholder:text-[#6a6a6f] focus:outline-none focus:border-[#10B981] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Senha */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              disabled={isLogging}
              autoComplete="current-password"
              className="w-full bg-transparent border-b-2 border-[#10B981] px-0 py-3 text-[#F8FAFC] placeholder:text-[#6a6a6f] focus:outline-none focus:border-[#10B981] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-[#ef4444] text-sm text-center">{error}</p>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={isLogging}
            className="w-full bg-[#10B981] text-black font-bold py-3.5 rounded-lg hover:bg-[#059669] disabled:opacity-50 transition-all"
          >
            {isLogging ? 'Entrando...' : 'Entrar'}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-[9px] text-[#CBD5E1]/40 mt-16 uppercase tracking-widest">
          Desenvolvido por Zafalão Tech
        </p>
      </div>
    </div>
  );
}
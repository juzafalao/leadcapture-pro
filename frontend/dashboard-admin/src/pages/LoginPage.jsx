import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import LeadCaptureLogo from '../components/LeadCaptureLogo';

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
      <div className="min-h-screen bg-[#0a0a0b] flex flex-col items-center justify-center gap-6">
        <div className="animate-pulse">
          <LeadCaptureLogo variant="full" size={160} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        
        {/* Logo e Título */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <LeadCaptureLogo variant="full" size={160} />
          </div>
          <p className="text-xs text-[#4a4a4f] tracking-wider">Acesse sua conta</p>
        </div>

        {/* Form - APENAS LINHAS */}
        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Email - Apenas linha laranja */}
          <div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              disabled={isLogging}
              autoComplete="email"
              className="w-full bg-transparent border-b-2 border-[#ee7b4d] px-0 py-3 text-white placeholder:text-[#6a6a6f] focus:outline-none focus:border-[#ee7b4d] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Senha - Apenas linha laranja */}
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Senha"
              disabled={isLogging}
              autoComplete="current-password"
              className="w-full bg-transparent border-b-2 border-[#ee7b4d] px-0 py-3 text-white placeholder:text-[#6a6a6f] focus:outline-none focus:border-[#ee7b4d] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Error - Apenas texto, sem caixa */}
          {error && (
            <p className="text-[#ef4444] text-sm text-center">{error}</p>
          )}

          {/* Botão - Simples e clean */}
          <button
            type="submit"
            disabled={isLogging}
            className="w-full bg-[#ee7b4d] text-black font-bold py-3.5 rounded-lg hover:bg-[#d4663a] disabled:opacity-50 transition-all"
          >
            {isLogging ? 'Entrando...' : 'Entrar'}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-[9px] text-white/20 mt-16 font-black uppercase tracking-widest">
          LeadCapture Pro — Desenvolvido por Zafalão Tech
        </p>
      </div>
    </div>
  );
}
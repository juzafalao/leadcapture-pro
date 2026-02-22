import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import LogoIcon from '../components/LogoIcon';

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
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
          <span className="text-[#10B981] font-black tracking-widest text-xs uppercase">Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1220] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Glow decorativo de fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#10B981]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">

        {/* Logo e Título */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <LogoIcon size={72} />
          </div>
          <h1 className="text-3xl font-light text-[#F8FAFC] mb-2">
            Lead<span className="text-[#10B981] font-bold">Capture</span> Pro
          </h1>
          <p className="text-xs text-[#CBD5E1]/50 tracking-wider">Acesse sua conta</p>
        </div>

        {/* Form */}
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
              className="w-full bg-transparent border-b-2 border-[#10B981]/50 px-0 py-3 text-[#F8FAFC] placeholder:text-[#CBD5E1]/40 focus:outline-none focus:border-[#10B981] transition-colors disabled:opacity-50"
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
              className="w-full bg-transparent border-b-2 border-[#10B981]/50 px-0 py-3 text-[#F8FAFC] placeholder:text-[#CBD5E1]/40 focus:outline-none focus:border-[#10B981] transition-colors disabled:opacity-50"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={isLogging}
            className="w-full bg-gradient-to-r from-[#10B981] to-[#059669] text-black font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-[#10B981]/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {isLogging ? (
              <>
                <div className="w-4 h-4 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                Entrando...
              </>
            ) : 'Entrar'}
          </button>

        </form>

        {/* Footer */}
        <p className="text-center text-[9px] text-[#CBD5E1]/30 mt-16 uppercase tracking-[0.3em]">
          © 2026 LeadCapture Pro · Zafalão Tech
        </p>
      </div>
    </div>
  );
}

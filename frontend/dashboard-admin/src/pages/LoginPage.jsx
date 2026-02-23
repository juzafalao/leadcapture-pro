import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../components/AuthContext';
import logoLogin from '../assets/logo-login.jpg';

const EmailIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

export default function LoginPage() {
  const { login, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="min-h-screen bg-[#060D1A] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#060D1A] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Placeholder color via CSS class — evita placeholder:text-[#hex] que causa esbuild regex error */}
      <style>{`.lc-input::placeholder{color:#475569}`}</style>

      {/* Glow superior direito */}
      <div
        className="absolute -top-32 -right-32 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(16,185,129,0.09) 0%, transparent 70%)' }}
      />

      {/* Glow inferior esquerdo */}
      <div
        className="absolute -bottom-40 -left-40 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(14,165,233,0.06) 0%, transparent 70%)' }}
      />

      {/* Grid de pontos */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.055) 1px, transparent 1px)',
        backgroundSize: '36px 36px',
      }} />

      {/* Logo fantasma (watermark) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
        <div style={{ opacity: 0.05, transform: 'scale(1.1)' }}>
          <img src={logoLogin} alt="" style={{ width: 520 }} />
        </div>
      </div>

      {/* Card central */}
      <div className="w-full max-w-[420px] relative z-10">
        <div
          className="rounded-3xl p-10 shadow-2xl"
          style={{
            background: 'rgba(15,23,42,0.82)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(16,185,129,0.05)',
          }}
        >
          {/* Topo — logo + brand */}
          <div className="text-center mb-9">
            <div className="flex justify-center mb-6">
              <div
                className="w-[180px] h-[110px] rounded-2xl flex items-center justify-center overflow-hidden"
              >
                <img src={logoLogin} alt="LeadCapture Pro" style={{ width: '100%', height: '100%', objectFit: 'contain', imageRendering: 'auto', mixBlendMode: 'lighten' }} />
              </div>
            </div>

            <h1 className="text-[22px] font-bold text-[#F8FAFC] tracking-tight leading-tight">
              Bem-vindo de volta
            </h1>
            <p className="text-[13px] text-[#94A3B8] mt-1.5">
              Acesse sua conta{' '}
              <span className="text-[#10B981] font-medium">LeadCapture Pro</span>
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Email */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none">
                <EmailIcon />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Seu e-mail"
                disabled={isLogging}
                autoComplete="email"
                className="lc-input w-full rounded-xl pl-11 pr-5 py-3.5 text-[#F8FAFC] text-sm focus:outline-none transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(16,185,129,0.45)';
                  e.target.style.background = 'rgba(16,185,129,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.04)';
                }}
              />
            </div>

            {/* Senha */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569] pointer-events-none">
                <LockIcon />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                disabled={isLogging}
                autoComplete="current-password"
                className="lc-input w-full rounded-xl pl-11 pr-12 py-3.5 text-[#F8FAFC] text-sm focus:outline-none transition-all disabled:opacity-50"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => {
                  e.target.style.border = '1px solid rgba(16,185,129,0.45)';
                  e.target.style.background = 'rgba(16,185,129,0.05)';
                }}
                onBlur={(e) => {
                  e.target.style.border = '1px solid rgba(255,255,255,0.08)';
                  e.target.style.background = 'rgba(255,255,255,0.04)';
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                disabled={isLogging}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#475569] hover:text-[#94A3B8] transition-colors"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>

            {/* Erro */}
            {error && (
              <div
                className="rounded-xl px-4 py-3"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.22)',
                }}
              >
                <p className="text-red-400 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Botão principal */}
            <button
              type="submit"
              disabled={isLogging}
              className="w-full font-bold py-3.5 rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-1"
              style={{
                background: isLogging
                  ? 'linear-gradient(135deg, #059669, #047857)'
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#000',
                boxShadow: isLogging ? 'none' : '0 8px 32px rgba(16,185,129,0.28)',
              }}
            >
              {isLogging ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar na plataforma'
              )}
            </button>

          </form>

          {/* Divisor */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            <span className="text-[11px] text-[#334155] uppercase tracking-wider">LeadCapture Pro</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
          </div>

          {/* Badge de segurança */}
          <div className="flex items-center justify-center gap-2">
            <div
              className="w-1.5 h-1.5 rounded-full bg-[#10B981]"
              style={{ boxShadow: '0 0 6px #10B981' }}
            />
            <p className="text-[10px] text-[#475569] tracking-wide">Conexão segura e criptografada</p>
          </div>

        </div>
      </div>

      {/* Footer externo */}
      <p className="text-center text-[9px] text-[#1E293B] mt-6 uppercase tracking-[0.35em]">
        © 2026 Zafalão Tech · Todos os direitos reservados
      </p>

    </div>
  );
}

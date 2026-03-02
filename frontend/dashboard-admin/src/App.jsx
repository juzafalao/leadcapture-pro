// ============================================================
// App.jsx — Tenant-Aware + Role-Level Based Routes
// LeadCapture Pro — Zafalão Tech
//
// MUDANÇAS vs versão anterior:
// 1. PrivateRoute aceita minLevel (número) OU allowedRoles (texto, retrocompatível)
// 2. PrivateRoute aceita platformOnly para rotas de Platform Admin
// 3. Constantes ROLES_* substituídas por LEVEL_* numéricos
// 4. leads-sistema usa platformOnly ao invés de ROLES_ADMIN
// ============================================================

import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';

const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const MarcasPage       = lazy(() => import('./pages/MarcasPage'));
const SegmentosPage    = lazy(() => import('./pages/SegmentosPage'));
const UsuariosPage     = lazy(() => import('./pages/UsuariosPage'));
const SettingsPage     = lazy(() => import('./pages/SettingsPage'));
const LeadsSistemaPage = lazy(() => import('./pages/LeadsSistemaPage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const LandingPage      = lazy(() => import('./pages/LandingPage'));
const AnalyticsPage    = lazy(() => import('./pages/AnalyticsPage'));
const RelatoriosPage   = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage    = lazy(() => import('./pages/AutomacaoPage'));

import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 3,
      gcTime: 1000 * 60 * 15,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Níveis de acesso (da tabela roles) ──────────────────────
// 5 = Administrador (super admin)
// 4 = Diretor
// 3 = Gestor
// 2 = Consultor
// 1 = Cliente
const LEVEL_CONSULTOR = 2;
const LEVEL_GESTOR    = 3;
const LEVEL_DIRETOR   = 4;

// Retrocompatibilidade: manter arrays de texto para migração gradual
const ROLES_CONSULTOR = ['Administrador', 'admin', 'Diretor', 'Gestor', 'Consultor'];
const ROLES_GESTOR    = ['Administrador', 'admin', 'Diretor', 'Gestor'];
const ROLES_DIRETOR   = ['Administrador', 'admin', 'Diretor'];
const ROLES_ADMIN     = ['Administrador', 'admin'];

/**
 * PrivateRoute — Controle de acesso por nível ou role
 * 
 * Props:
 *   minLevel     (number)  — nível mínimo para acessar (novo, preferido)
 *   allowedRoles (array)   — roles permitidas por texto (retrocompatível)
 *   platformOnly (boolean) — requer isPlatformAdmin() (para leads-sistema)
 */
function PrivateRoute({ children, minLevel, allowedRoles, platformOnly }) {
  const { usuario, loading, isAuthenticated, isPlatformAdmin, hasMinLevel } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1220] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Verificação Platform Admin (para rotas como leads-sistema)
  if (platformOnly && !isPlatformAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificação por nível numérico (novo sistema)
  if (minLevel && !hasMinLevel(minLevel)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificação por texto (retrocompatível — pode ser removido quando migração completa)
  if (allowedRoles && !allowedRoles.includes(usuario?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AnimatedPage({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

function AppRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="sync">
      <Routes location={location} key={location.pathname}>
        {/* Rotas públicas */}
        <Route path="/login"         element={<AnimatedPage><Suspense fallback={<PageFallback />}><LoginPage /></Suspense></AnimatedPage>} />
        <Route path="/landing/:slug" element={<AnimatedPage><Suspense fallback={<PageFallback />}><LandingPage /></Suspense></AnimatedPage>} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rotas autenticadas — qualquer usuário */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><DashboardPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Consultor+ (nível >= 2) */}
        <Route path="/relatorios" element={
          <PrivateRoute minLevel={LEVEL_CONSULTOR} allowedRoles={ROLES_CONSULTOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><RelatoriosPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Gestor+ (nível >= 3) */}
        <Route path="/marcas" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><MarcasPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />
        <Route path="/segmentos" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><SegmentosPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />
        <Route path="/usuarios" element={
          <PrivateRoute minLevel={LEVEL_GESTOR} allowedRoles={ROLES_GESTOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><UsuariosPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* Diretor+ (nível >= 4) */}
        <Route path="/analytics" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />
        <Route path="/automacao" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><AutomacaoPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />
        <Route path="/configuracoes" element={
          <PrivateRoute minLevel={LEVEL_DIRETOR} allowedRoles={ROLES_DIRETOR}>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><SettingsPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />

        {/* ✅ MUDANÇA PRINCIPAL: Platform Admin Only (não apenas "admin") */}
        <Route path="/leads-sistema" element={
          <PrivateRoute platformOnly>
            <AuthenticatedLayout><AnimatedPage><Suspense fallback={<PageFallback />}><LeadsSistemaPage /></Suspense></AnimatedPage></AuthenticatedLayout>
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex bg-[#0F172A] min-h-screen font-sans text-[#F8FAFC]">
      <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-[#1F2937] py-4 text-center bg-[#0F172A]">
          <p className="text-[9px] text-[#CBD5E1]/30 font-bold uppercase tracking-[0.2em]">
            Desenvolvido por — <span className="text-[#10B981]">Zafalão Tech</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

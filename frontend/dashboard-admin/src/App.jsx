import React, { useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Header from './components/layout/Header';

// Páginas carregadas imediatamente (usadas com frequência)
import DashboardPage    from './pages/DashboardPage';
import MarcasPage       from './pages/MarcasPage';
import SegmentosPage    from './pages/SegmentosPage';
import UsuariosPage     from './pages/UsuariosPage';
import SettingsPage     from './pages/SettingsPage';
import LeadsSistemaPage from './pages/LeadsSistemaPage';
import LoginPage        from './pages/LoginPage';
import LandingPage      from './pages/LandingPage';

// Lazy load páginas pesadas
const InteligenciaPage = lazy(() => import('./pages/InteligenciaPage'));
const AnalyticsPage    = lazy(() => import('./pages/AnalyticsPage'));
const RelatoriosPage   = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage    = lazy(() => import('./pages/AutomacaoPage'));

// Auth
import { AuthProvider, useAuth } from './components/AuthContext.jsx';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const PageFallback = () => (
  <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
    <span className="text-[#ee7b4d] font-black tracking-widest animate-pulse">CARREGANDO...</span>
  </div>
);

function PrivateRoute({ children, allowedRoles }) {
  const { usuario, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="text-6xl animate-pulse">⏳</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (allowedRoles && !allowedRoles.includes(usuario?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex bg-[#0a0a0b] min-h-screen font-sans text-white">
      <Sidebar
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />

        <div className="flex-1">
          {children}
        </div>

        <footer className="border-t border-white/5 py-6 text-center bg-[#0a0a0b]">
          <p className="text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em]">
            © 2026 LeadCapture Pro · <span className="text-[#ee7b4d]">Zafalão Tech</span>
          </p>
        </footer>
      </main>
    </div>
  );
}

const ROLES_GESTOR    = ['Administrador', 'Diretor', 'Gestor'];
const ROLES_ADMIN     = ['Administrador'];

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
          {/* ── Públicas ─────────────────────────────────── */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/landing/:slug"   element={<LandingPage />} />

          {/* ── Redirect raiz ────────────────────────────── */}
          <Route path="/"
            element={<PrivateRoute><Navigate to="/dashboard" replace /></PrivateRoute>}
          />

          {/* ── Leads / Dashboard ────────────────────────── */}
          <Route path="/dashboard"
            element={<PrivateRoute><AuthenticatedLayout><DashboardPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Inteligência / BI (Gestor+) ──────────────── */}
          <Route path="/inteligencia"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><InteligenciaPage /></Suspense></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Analytics (Gestor+) ──────────────────────── */}
          <Route path="/analytics"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><AnalyticsPage /></Suspense></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Relatórios (Gestor+) ─────────────────────── */}
          <Route path="/relatorios"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><RelatoriosPage /></Suspense></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Automação (Gestor+) ──────────────────────── */}
          <Route path="/automacao"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><Suspense fallback={<PageFallback />}><AutomacaoPage /></Suspense></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Marcas (Gestor+) ─────────────────────────── */}
          <Route path="/marcas"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><MarcasPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Segmentos (Gestor+) ──────────────────────── */}
          <Route path="/segmentos"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><SegmentosPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Usuários / Time (Gestor+) ────────────────── */}
          <Route path="/usuarios"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><UsuariosPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Prospects do Sistema / LeadCapture Pro (Gestor+) ── */}
          <Route path="/leads-sistema"
            element={<PrivateRoute allowedRoles={ROLES_GESTOR}><AuthenticatedLayout><LeadsSistemaPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Configurações (todos os autenticados) ────── */}
          <Route path="/configuracoes"
            element={<PrivateRoute><AuthenticatedLayout><SettingsPage /></AuthenticatedLayout></PrivateRoute>}
          />

          {/* ── Fallback ─────────────────────────────────── */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

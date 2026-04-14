// App.jsx -- LeadCapture Pro
// Restaura: Header, pl-32 do main, ChatBot, estrutura original
import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './components/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';

// -- Lazy imports -----------------------------------------
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const MarcasPage         = lazy(() => import('./pages/MarcasPage'));
const SegmentosPage      = lazy(() => import('./pages/SegmentosPage'));
const UsuariosPage       = lazy(() => import('./pages/UsuariosPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const LeadsSistemaPage   = lazy(() => import('./pages/LeadsSistemaPage'));
const LoginPage          = lazy(() => import('./pages/LoginPage'));
const LandingPage        = lazy(() => import('./pages/LandingPage'));
const AnalyticsPage      = lazy(() => import('./pages/AnalyticsPage'));
const RelatoriosPage     = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage      = lazy(() => import('./pages/AutomacaoPage'));
const AuditLogPage       = lazy(() => import('./pages/AuditLogPage'));
const KanbanPage         = lazy(() => import('./pages/KanbanPage'));
const CRMPage            = lazy(() => import('./pages/CRMPage'));
const EmailMarketingPage = lazy(() => import('./pages/EmailMarketingPage'));
const CanaisPage         = lazy(() => import('./pages/CanaisPage'));
const APIPage            = lazy(() => import('./pages/APIPage'));
const MonitoramentoPage  = lazy(() => import('./pages/MonitoramentoPage'));
const RankingPage        = lazy(() => import('./pages/RankingPage'));

const Sidebar  = lazy(() => import('./components/Sidebar'));
const Header   = lazy(() => import('./components/layout/Header'));
const ChatBot  = lazy(() => import('./components/ChatBot'));

// -- Query Client -----------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5,
      gcTime:    1000 * 60 * 30,
    },
  },
});

// -- Niveis de acesso -------------------------------------
const LEVEL_CONSULTOR = 2;
const LEVEL_GESTOR    = 3;
const LEVEL_DIRETOR   = 4;
const LEVEL_ADMIN     = 5;

const ROLES_CONSULTOR = ['Consultor','Operador','Gestor','Diretor','Administrador','admin'];
const ROLES_GESTOR    = ['Gestor','Diretor','Administrador','admin'];
const ROLES_DIRETOR   = ['Diretor','Administrador','admin'];
const ROLES_ADMIN     = ['Administrador','admin'];

// -- Loading ---------------------------------------------
const PageFallback = () => (
  <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
  </div>
);

const AnimatedPage = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.18 }}
  >
    {children}
  </motion.div>
);

// -- Layout autenticado (Sidebar fixo + Header + ChatBot) --
function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex bg-[#0F172A] min-h-screen font-sans text-[#F8FAFC]">
      <Suspense fallback={null}>
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      </Suspense>
      <main className="flex-1 min-h-screen flex flex-col lg:pl-32">
        <Suspense fallback={null}>
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
        </Suspense>
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-white/[0.05] py-4 text-center bg-[#0F172A]">
          <p className="text-[9px] text-white/20 font-bold uppercase tracking-[0.2em]">
            Desenvolvido por -- <span className="text-[#10B981]">Zafalao Tech</span>
          </p>
        </footer>
      </main>
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
    </div>
  );
}

// -- PrivateRoute ----------------------------------------
function PrivateRoute({ children, allowedRoles = ROLES_CONSULTOR }) {
  const { usuario, loading, isAuthenticated } = useAuth();
  if (loading) return <PageFallback />;
  if (!isAuthenticated || !usuario) return <Navigate to="/login" replace />;
  const isSuperAdmin = usuario.is_super_admin === true || usuario.is_platform === true;
  if (isSuperAdmin) return children;
  if (!allowedRoles.includes(usuario.role || '')) return <Navigate to="/dashboard" replace />;
  return children;
}

// -- Rotas -----------------------------------------------
function AppRoutes() {
  const location = useLocation();
  const W = (Page, roles = ROLES_CONSULTOR) => (
    <PrivateRoute allowedRoles={roles}>
      <AuthenticatedLayout>
        <AnimatedPage>
          <Suspense fallback={<PageFallback />}>
            <Page />
          </Suspense>
        </AnimatedPage>
      </AuthenticatedLayout>
    </PrivateRoute>
  );

  return (
    <AnimatePresence mode="sync">
      <Routes location={location} key={location.pathname}>
        {/* Publicas */}
        <Route path="/login"          element={<AnimatedPage><Suspense fallback={<PageFallback />}><LoginPage /></Suspense></AnimatedPage>} />
        <Route path="/landing/:slug"  element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
        <Route path="/lp/:slug"       element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
        <Route path="/"               element={<Navigate to="/login" replace />} />

        {/* Consultor+ */}
        <Route path="/dashboard"      element={W(DashboardPage)} />
        <Route path="/kanban"         element={W(KanbanPage)} />
        <Route path="/ranking"        element={W(RankingPage)} />
        <Route path="/configuracoes"  element={W(SettingsPage)} />

        {/* Gestor+ */}
        <Route path="/relatorios"     element={W(RelatoriosPage,     ROLES_GESTOR)} />
        <Route path="/email-marketing"element={W(EmailMarketingPage, ROLES_GESTOR)} />
        <Route path="/canais"         element={W(CanaisPage,         ROLES_GESTOR)} />
        <Route path="/marcas"         element={W(MarcasPage,         ROLES_GESTOR)} />
        <Route path="/segmentos"      element={W(SegmentosPage,      ROLES_GESTOR)} />
        <Route path="/usuarios"       element={W(UsuariosPage,       ROLES_GESTOR)} />
        <Route path="/automacao"      element={W(AutomacaoPage,      ROLES_GESTOR)} />

        {/* Diretor+ */}
        <Route path="/analytics"      element={W(AnalyticsPage,      ROLES_DIRETOR)} />
        <Route path="/crm"            element={W(CRMPage,            ROLES_DIRETOR)} />
        <Route path="/audit-log"      element={W(AuditLogPage,       ROLES_DIRETOR)} />
        <Route path="/api-docs"       element={W(APIPage,            ROLES_DIRETOR)} />

        {/* Admin */}
        <Route path="/leads"          element={W(LeadsSistemaPage,   ROLES_ADMIN)} />
        <Route path="/monitoramento"  element={W(MonitoramentoPage,  ROLES_ADMIN)} />

        <Route path="*"               element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <AppRoutes />
          </Router>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

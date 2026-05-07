// App.jsx -- LeadCapture Pro
import React, { lazy, Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion'; // AnimatePresence usado nas rotas públicas
import { AuthProvider, useAuth } from './components/AuthContext';
import { TenantProvider } from './components/TenantContext';
import ErrorBoundary from './components/ErrorBoundary';

// -- Lazy imports -----------------------------------------
const DashboardOverviewPage = lazy(() => import('./pages/DashboardOverviewPage'));
const DashboardPage         = lazy(() => import('./pages/DashboardPage'));
const MarcasPage            = lazy(() => import('./pages/MarcasPage'));
const SegmentosPage         = lazy(() => import('./pages/SegmentosPage'));
const UsuariosPage          = lazy(() => import('./pages/UsuariosPage'));
const SettingsPage          = lazy(() => import('./pages/SettingsPage'));
const LeadsSistemaPage      = lazy(() => import('./pages/LeadsSistemaPage'));
const LoginPage             = lazy(() => import('./pages/LoginPage'));
const LandingPage           = lazy(() => import('./pages/LandingPage'));
const RelatoriosPage        = lazy(() => import('./pages/RelatoriosPage'));
const AutomacaoPage         = lazy(() => import('./pages/AutomacaoPage'));
const AuditLogPage          = lazy(() => import('./pages/AuditLogPage'));
const KanbanPage            = lazy(() => import('./pages/KanbanPage'));
const CRMPage               = lazy(() => import('./pages/CRMPage'));
const EmailMarketingPage    = lazy(() => import('./pages/EmailMarketingPage'));
const CanaisPage            = lazy(() => import('./pages/CanaisPage'));
const APIPage               = lazy(() => import('./pages/APIPage'));
const MonitoramentoPage     = lazy(() => import('./pages/MonitoramentoPage'));
const RankingPage           = lazy(() => import('./pages/RankingPage'));
const CapturaPage           = lazy(() => import('./pages/CapturaPage'));
const WhatsAppPage          = lazy(() => import('./pages/WhatsAppPage'));
const AgentePage            = lazy(() => import('./pages/AgentePage'));
const AnalyticsPage         = lazy(() => import('./pages/AnalyticsPage'));
const ImportarLeadsPage     = lazy(() => import('./pages/ImportarLeadsPage'));
const FluxoVidaLeadPage     = lazy(() => import('./pages/FluxoVidaLeadPage'));

const Sidebar  = lazy(() => import('./components/Sidebar'));
const Header   = lazy(() => import('./components/layout/Header'));
const ChatBot  = lazy(() => import('./components/ChatBot'));
const FloatingCalculator = lazy(() => import('./components/FloatingCalculator'));

// -- Query Client -----------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 10,
      gcTime:    1000 * 60 * 60,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
  },
});

// -- Níveis de acesso -------------------------------------
const ROLES_CONSULTOR = ['Consultor', 'Operador', 'Gestor', 'Diretor', 'Administrador', 'admin'];
const ROLES_GESTOR    = ['Gestor', 'Diretor', 'Administrador', 'admin'];
const ROLES_DIRETOR   = ['Diretor', 'Administrador', 'admin'];
const ROLES_ADMIN     = ['Administrador', 'admin'];

// -- Loading ----------------------------------------------
const PageFallback = () => (
  <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
    <div className="w-10 h-10 border-2 border-[#10B981] border-t-transparent rounded-full animate-spin" />
  </div>
);

// Transição simples sem AnimatePresence — evita layout shift percebido como zoom
const AnimatedPage = ({ children }) => <>{children}</>;

// -- Layout autenticado (renderizado UMA VEZ, nunca remontado durante navegação) --
function AuthenticatedLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  return (
    <div className="flex bg-[#0F172A] min-h-screen font-sans text-[#F8FAFC]">
      <Suspense fallback={null}>
        <Sidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
      </Suspense>
      <div
        className="hidden lg:block shrink-0"
        style={{ width: 'var(--sidebar-w, 240px)', transition: 'width 0.25s ease' }}
      />
      <main className="flex-1 min-h-screen flex flex-col min-w-0">
        <Suspense fallback={null}>
          <Header onMenuClick={() => setMobileMenuOpen(true)} />
        </Suspense>
        <div className="flex-1">
          {children}
        </div>
        <footer className="border-t border-white/[0.04] py-5 px-6 bg-[#0F172A]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-screen-xl mx-auto">
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-white/15 font-black uppercase tracking-[0.25em]">Desenvolvido por</span>
              <span className="text-[10px] font-black text-[#10B981] tracking-wide">Zafalão Tech</span>
            </div>
            <p className="text-[9px] text-white/10 font-medium tracking-wider">
              CNPJ 65.465.771/0001-08 · © {new Date().getFullYear()} LeadCapture Pro · Todos os direitos reservados
            </p>
          </div>
        </footer>
      </main>
      <Suspense fallback={null}>
        <ChatBot />
      </Suspense>
      <Suspense fallback={null}>
        <FloatingCalculator />
      </Suspense>
    </div>
  );
}

// -- Rotas ------------------------------------------------
function AppRoutes() {
  const location = useLocation();
  const { usuario, loading, isAuthenticated } = useAuth();

  if (loading) return <PageFallback />;

  // Rotas públicas — não precisam de autenticação
  if (!isAuthenticated) {
    return (
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/login"         element={<AnimatedPage><Suspense fallback={<PageFallback />}><LoginPage /></Suspense></AnimatedPage>} />
          <Route path="/landing/:slug" element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
          <Route path="/lp/:slug"      element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
          <Route path="*"              element={<Navigate to="/login" replace />} />
        </Routes>
      </AnimatePresence>
    );
  }

  // Landing pages acessíveis mesmo autenticado
  if (location.pathname.startsWith('/landing/') || location.pathname.startsWith('/lp/')) {
    return (
      <Routes>
        <Route path="/landing/:slug" element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
        <Route path="/lp/:slug"      element={<Suspense fallback={<PageFallback />}><LandingPage /></Suspense>} />
      </Routes>
    );
  }

  // Redireciona /login para /dashboard se já autenticado
  if (location.pathname === '/login' || location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificação de role
  const isSuperAdmin = usuario?.is_super_admin === true || usuario?.is_platform === true
    || ['Administrador', 'admin'].includes(usuario?.role);
  const hasRole = (roles) => isSuperAdmin || roles.includes(usuario?.role || '');

  const page = (Page, roles = ROLES_CONSULTOR) =>
    hasRole(roles)
      ? <AnimatedPage><Suspense fallback={<PageFallback />}><Page /></Suspense></AnimatedPage>
      : <Navigate to="/dashboard" replace />;

  // Layout renderizado UMA VEZ — conteúdo troca sem animação (evita zoom)
  return (
    <AuthenticatedLayout>
      <Routes>
          {/* PRINCIPAL */}
          <Route path="/dashboard"     element={page(DashboardOverviewPage)} />
          <Route path="/monitoramento" element={page(MonitoramentoPage, ROLES_DIRETOR)} />

          {/* OPERAÇÃO */}
          <Route path="/pipeline"        element={page(DashboardPage)} />
          <Route path="/kanban"          element={page(KanbanPage)} />
          <Route path="/fluxo-vida-lead" element={page(FluxoVidaLeadPage, ROLES_GESTOR)} />
          <Route path="/canais"          element={page(CanaisPage, ROLES_GESTOR)} />

          {/* AUTOMAÇÃO */}
          <Route path="/captura"         element={page(CapturaPage,       ROLES_GESTOR)} />
          <Route path="/whatsapp"        element={page(WhatsAppPage,      ROLES_GESTOR)} />
          <Route path="/agente"          element={page(AgentePage)} />
          <Route path="/automacao"       element={page(AutomacaoPage,     ROLES_GESTOR)} />
          <Route path="/email-marketing" element={page(EmailMarketingPage, ROLES_GESTOR)} />

          {/* PERFORMANCE */}
          <Route path="/ranking"         element={page(RankingPage)} />

          {/* OPERAÇÃO extras */}
          <Route path="/importar"        element={page(ImportarLeadsPage, ROLES_GESTOR)} />

          {/* INTELIGÊNCIA */}
          <Route path="/relatorios"      element={page(RelatoriosPage,  ROLES_GESTOR)} />
          <Route path="/analytics"       element={page(AnalyticsPage,   ROLES_DIRETOR)} />

          {/* SISTEMA */}
          <Route path="/backoffice"      element={page(LeadsSistemaPage,   ROLES_ADMIN)} />
          <Route path="/marcas"          element={page(MarcasPage,         ROLES_GESTOR)} />
          <Route path="/segmentos"       element={page(SegmentosPage,      ROLES_GESTOR)} />
          <Route path="/usuarios"        element={page(UsuariosPage,       ROLES_GESTOR)} />
          <Route path="/audit-log"       element={page(AuditLogPage,       ROLES_DIRETOR)} />
          <Route path="/api-docs"        element={page(APIPage,            ROLES_DIRETOR)} />
          <Route path="/configuracoes"   element={page(SettingsPage,       ROLES_DIRETOR)} />

          {/* CRM */}
          <Route path="/crm"             element={page(CRMPage, ROLES_GESTOR)} />

          {/* Legado */}
          <Route path="/leads"           element={<Navigate to="/pipeline"  replace />} />

          <Route path="*"                element={<Navigate to="/dashboard" replace />} />
        </Routes>
    </AuthenticatedLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TenantProvider>
            <Router>
              <AppRoutes />
            </Router>
          </TenantProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

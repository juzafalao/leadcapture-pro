import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';

// Componente para rotas protegidas
function ProtectedRoute({ children }) {
  const { usuario, loading } = useAuth();

  console.log('🛡️ ProtectedRoute - usuario:', usuario?.nome || 'null', 'loading:', loading);

  if (loading) {
    console.log('⏳ Ainda carregando...');
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    console.log('❌ Sem usuário, redirecionando para login');
    return <Navigate to="/login" replace />;
  }

  console.log('✅ Usuário autenticado, renderizando dashboard');
  return <>{children}</>;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
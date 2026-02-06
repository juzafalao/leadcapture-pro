import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import SettingsPage from './pages/SettingsPage';
// import LeadsPage from './pages/LeadsPage'; // Temporariamente comentado
// import FunnelPage from './pages/admin/FunnelPage'; // Ainda não criamos

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          {/* <Route path="/leads" element={<LeadsPage />} /> */}
          <Route path="/settings" element={<SettingsPage />} />
          {/* <Route path="/admin/funnel" element={<FunnelPage />} /> */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
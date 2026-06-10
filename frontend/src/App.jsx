import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import BusinessProfile from './pages/BusinessProfile';
import WebsiteAudit from './pages/WebsiteAudit';
import SEOAudit from './pages/SEOAudit';
import SocialMedia from './pages/SocialMedia';
import MarketingStrategy from './pages/MarketingStrategy';
import Reports from './pages/Reports';
import Settings from './pages/Settings';

function App() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('user_theme') || 'purple';
    document.body.classList.remove('theme-purple', 'theme-dark', 'theme-blue', 'theme-green', 'theme-light');
    document.body.classList.add(`theme-${savedTheme}`);
  }, []);

  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute />}>
            <Route
              path="/*"
              element={
                <DashboardLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/business" element={<BusinessProfile />} />
                    <Route path="/audit" element={<WebsiteAudit />} />
                    <Route path="/seo" element={<SEOAudit />} />
                    <Route path="/social" element={<SocialMedia />} />
                    <Route path="/strategy" element={<MarketingStrategy />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/settings" element={<Settings />} />
                  </Routes>
                </DashboardLayout>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

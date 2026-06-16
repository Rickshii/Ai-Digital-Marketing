import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
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
import AdminDashboard from './pages/AdminDashboard';
import Subscription from './pages/Subscription';

// Wraps DashboardLayout around child routes via Outlet
const DashboardWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

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

          {/* All protected routes — ProtectedRoute renders Outlet if authenticated */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardWrapper />}>
              <Route index element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/business" element={<BusinessProfile />} />
              <Route path="/audit" element={<WebsiteAudit />} />
              <Route path="/seo" element={<SEOAudit />} />
              <Route path="/social" element={<SocialMedia />} />
              <Route path="/strategy" element={<MarketingStrategy />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/subscription" element={<Subscription />} />
            </Route>
          </Route>

        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;

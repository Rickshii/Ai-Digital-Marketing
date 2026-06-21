import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Briefcase, Globe, Search, Share2,
  Megaphone, FileText, Settings, LogOut, Menu, X,
  Sparkles, Bell, ChevronDown, TrendingUp, Zap, Shield, AlertCircle
} from 'lucide-react';
const API_BASE = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`).replace(/\/api$/, '');

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, color: 'from-violet-500 to-purple-600' },
  { name: 'Business Analysis', path: '/business', icon: Briefcase, color: 'from-blue-500 to-indigo-600' },
  { name: 'Website Audit', path: '/audit', icon: Globe, color: 'from-cyan-500 to-blue-500' },
  { name: 'SEO Audit', path: '/seo', icon: Search, color: 'from-emerald-500 to-teal-600' },
  { name: 'Social Media', path: '/social', icon: Share2, color: 'from-pink-500 to-rose-500' },
  { name: 'Marketing Strategy', path: '/strategy', icon: Megaphone, color: 'from-amber-500 to-orange-500' },
  { name: 'Reports', path: '/reports', icon: FileText, color: 'from-purple-500 to-violet-600' },
  { name: 'Settings', path: '/settings', icon: Settings, color: 'from-slate-500 to-slate-600' },
];

const bottomNavItems = [
  { name: 'Home', path: '/', icon: LayoutDashboard },
  { name: 'Business', path: '/business', icon: Briefcase },
  { name: 'Audit', path: '/audit', icon: Globe },
  { name: 'SEO', path: '/seo', icon: Search },
  { name: 'More', path: '/strategy', icon: Megaphone },
];

const DashboardLayout = ({ children }) => {
  const { user, logout, accessStatus } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [notifications, setNotifications] = useState(3);
  const dropdownRef = useRef(null);

  const isAdmin = user?.role === 'admin'
    || user?.role?.toLowerCase().includes('admin')
    || user?.role?.toLowerCase().includes('enterprise')
    || user?.email?.toLowerCase().includes('admin');

  const visibleNavItems = [...navItems];
  if (isAdmin && !visibleNavItems.some(item => item.path === '/admin')) {
    visibleNavItems.push({
      name: 'Admin Panel',
      path: '/admin',
      icon: Shield,
      color: 'from-rose-500 to-red-600'
    });
  }

  // On mobile bottom nav, replace 'More' with 'Admin' when user is admin (keep 5 items max)
  const visibleBottomNavItems = isAdmin
    ? [
        { name: 'Home',     path: '/',        icon: LayoutDashboard },
        { name: 'Business', path: '/business', icon: Briefcase },
        { name: 'Audit',    path: '/audit',    icon: Globe },
        { name: 'Reports',  path: '/reports',  icon: FileText },
        { name: 'Admin',    path: '/admin',    icon: Shield },
      ]
    : [...bottomNavItems];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const [notificationDropdown, setNotificationDropdown] = useState(false);
  const notifDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
      if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
        setNotificationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (accessStatus && !accessStatus.has_access) {
      const premiumPaths = ['/audit', '/seo', '/social', '/strategy', '/reports', '/business'];
      const currentPath = location.pathname;
      const isPremiumPath = premiumPaths.some(p => currentPath === p || currentPath.startsWith(p + '/'));
      
      // Let dashboard render, but redirect if they try to access premium features
      if (isPremiumPath && currentPath !== '/subscription') {
        navigate('/subscription');
      }
    }
  }, [accessStatus, location.pathname, navigate]);


  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* ──────────── DESKTOP SIDEBAR ──────────── */}
      <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 fixed inset-y-0 left-0 z-30 bg-white border-r border-slate-100 shadow-sm">
        {/* Brand */}
        <div className="flex items-center gap-3 h-16 px-6 border-b border-slate-100">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-800 text-lg tracking-tight">MarketerAI</span>
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[10px] text-emerald-600 font-medium">Live Analysis</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-4 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url.startsWith('data:') || user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`}
                alt={user.full_name || 'User'}
                className="h-10 w-10 rounded-full object-cover shadow border border-slate-100"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold shadow">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.full_name || 'Guest'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role || 'Marketing Consultant'}</p>
            </div>
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
              <Zap className="h-3 w-3 text-emerald-600" />
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 mb-3">Navigation</p>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  active
                    ? 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 border border-violet-100 shadow-sm'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                }`}
              >
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                  active
                    ? `bg-gradient-to-br ${item.color} text-white shadow-sm`
                    : 'bg-slate-100 text-slate-500 group-hover:bg-slate-200'
                }`}>
                  <Icon className="h-4 w-4" />
                </span>
                {item.name}
                {active && (
                  <motion.div layoutId="active-pill" className="ml-auto h-1.5 w-1.5 rounded-full bg-violet-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Upgrade / Subscription Status Card */}
        <div className="p-4 border-t border-slate-100 space-y-3">
          {accessStatus && (
            <div className={`rounded-xl p-4 text-white shadow-md ${
              accessStatus.has_access 
                ? 'bg-gradient-to-br from-violet-500 to-indigo-600' 
                : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/10'
            }`}>
              {isAdmin ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Administrator</span>
                  </div>
                  <p className="text-[11px] opacity-90">Unlimited platform analytics & system controls enabled.</p>
                </>
              ) : accessStatus.subscription_active ? (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">{accessStatus.subscription_plan} Plan</span>
                  </div>
                  <p className="text-[11px] opacity-90 mb-2">Subscription Active</p>
                  <p className="text-[10px] opacity-75">
                    Expires: {accessStatus.subscription_expiry ? new Date(accessStatus.subscription_expiry).toLocaleDateString() : 'N/A'}
                  </p>
                </>
              ) : accessStatus.trial_active ? (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Free Trial</span>
                  </div>
                  <p className="text-xs opacity-90 mb-3">{accessStatus.trial_days_left} Days Remaining</p>
                  <div className="w-full bg-white/20 rounded-full h-1.5 mb-1.5">
                    <div 
                      className="bg-white rounded-full h-1.5 transition-all duration-300"
                      style={{ width: `${Math.min(100, (accessStatus.trial_days_left / 3) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] opacity-75">Calculated from join date</p>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <AlertCircle className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">Plan Expired</span>
                  </div>
                  <p className="text-[11px] opacity-90 mb-3">Your 3-day trial has ended.</p>
                  <Link 
                    to="/subscription" 
                    className="block text-center w-full bg-white text-red-600 font-bold py-2 rounded-xl text-xs hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Upgrade Account
                  </Link>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>

      </aside>

      {/* ──────────── MAIN AREA ──────────── */}
      <div className="flex flex-col flex-1 lg:ml-64 xl:ml-72">
        {/* Top Bar */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between bg-white/80 backdrop-blur-xl border-b border-slate-100 px-4 md:px-6 shadow-sm">
          {/* Mobile brand + hamburger */}
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 lg:hidden">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-slate-800">MarketerAI</span>
            </div>
            {/* Desktop page title */}
            <div className="hidden lg:block">
              <h2 className="text-base font-semibold text-slate-700">
                {navItems.find(n => isActive(n.path))?.name || 'Dashboard'}
              </h2>
              <p className="text-xs text-slate-400">AI-Powered Marketing Insights</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Notification Bell */}
            <div className="relative" ref={notifDropdownRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setNotificationDropdown(p => !p);
                  if (profileDropdown) setProfileDropdown(false);
                }}
                className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 transition-all"
              >
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[9px] font-bold text-white">
                    {notifications}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {notificationDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-64 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/60 z-50"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1 flex justify-between items-center">
                      <p className="text-sm font-semibold text-slate-800">Notifications</p>
                      {notifications > 0 && (
                        <button onClick={() => setNotifications(0)} className="text-[10px] text-violet-600 font-semibold hover:underline">Mark all read</button>
                      )}
                    </div>
                    {notifications > 0 ? (
                      <div className="space-y-1">
                        <div className="px-3 py-2 text-xs rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors">
                          <p className="font-semibold text-slate-800">New Audit Report Ready</p>
                          <p className="opacity-80">Your website audit for acme.com is complete.</p>
                        </div>
                        <div className="px-3 py-2 text-xs rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors">
                          <p className="font-semibold text-slate-800">AI Strategy Generated</p>
                          <p className="opacity-80">Check out your new marketing strategy for Q3.</p>
                        </div>
                        <div className="px-3 py-2 text-xs rounded-lg hover:bg-slate-50 cursor-pointer text-slate-600 transition-colors">
                          <p className="font-semibold text-slate-800">System Update</p>
                          <p className="opacity-80">We've added new social media metrics!</p>
                        </div>
                      </div>
                    ) : (
                      <div className="px-3 py-4 text-center text-xs text-slate-500">
                        No new notifications.
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setProfileDropdown(p => !p);
                  if (notificationDropdown) setNotificationDropdown(false);
                }}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-50 transition-all"
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url.startsWith('data:') || user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`}
                    alt={user.full_name || 'User'}
                    className="h-7 w-7 rounded-full object-cover border border-slate-100"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold">
                    {initials}
                  </div>
                )}
                <span className="hidden md:block text-sm font-medium text-slate-700 max-w-[120px] truncate">{user?.full_name}</span>
                <ChevronDown className={`h-3.5 w-3.5 text-slate-400 transition-transform ${profileDropdown ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {profileDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-52 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl shadow-slate-200/60 z-50"
                  >
                    <div className="px-3 py-2 border-b border-slate-100 mb-1">
                      <p className="text-sm font-semibold text-slate-800">{user?.full_name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                    </div>
                    <Link to="/settings" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-6 md:py-8 pb-24 lg:pb-8">
          {accessStatus && !accessStatus.has_access && location.pathname !== '/subscription' && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 text-xs sm:text-sm">Trial Subscription Expired</p>
                  <p className="text-red-700 text-[11px] sm:text-xs mt-0.5">Please upgrade your subscription to enable Website SEO audits, strategy generators, and report compilers.</p>
                </div>
              </div>
              <Link 
                to="/subscription" 
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm shrink-0"
              >
                Upgrade Plan
              </Link>
            </motion.div>
          )}

          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {children}
          </motion.div>
        </main>

      </div>

      {/* ──────────── MOBILE SIDEBAR DRAWER ──────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl lg:hidden flex flex-col"
            >
              <div className="flex items-center justify-between h-16 px-5 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-bold text-slate-800 text-lg">MarketerAI</span>
                </div>
                <button onClick={() => setSidebarOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-4 py-4">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url.startsWith('data:') || user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE}${user.avatar_url}`}
                      alt={user.full_name || 'User'}
                      className="h-10 w-10 rounded-full object-cover border border-slate-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-bold">
                      {initials}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{user?.full_name}</p>
                    <p className="text-xs text-slate-400">{user?.role || 'Consultant'}</p>
                  </div>
                </div>
              </div>

              <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? 'bg-violet-50 text-violet-700 border border-violet-100'
                          : 'text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        active ? `bg-gradient-to-br ${item.color} text-white shadow-sm` : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="p-4 border-t border-slate-100">
                <button onClick={handleLogout} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ──────────── MOBILE BOTTOM NAV ──────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 shadow-lg">
        <div className="flex items-center justify-around h-16 px-1 sm:px-2 overflow-x-auto no-scrollbar">
          {visibleBottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-2 sm:px-3 py-2 rounded-xl transition-all ${
                  active ? 'text-violet-600' : 'text-slate-400'
                }`}
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-xl transition-all ${
                  active ? 'bg-violet-100' : ''
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-[9px] font-medium truncate w-full text-center">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;

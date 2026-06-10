import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Globe, CreditCard,
  ChevronRight, CheckCircle, Save, Zap, Sun, Moon,
  Mail, Phone, Building, MapPin, Lock, Key, Eye, EyeOff
} from 'lucide-react';

const sections = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
  { id: 'integrations', label: 'Integrations', icon: Globe },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
];

const Toggle = ({ enabled, onChange, label }) => (
  <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
    <span className="text-sm text-slate-700">{label}</span>
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${enabled ? 'bg-violet-500' : 'bg-slate-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  </div>
);

const integrations = [
  { name: 'Google Analytics 4', desc: 'Track website performance data', connected: true, icon: '📊' },
  { name: 'Google Search Console', desc: 'Monitor search rankings & indexing', connected: true, icon: '🔍' },
  { name: 'Mailchimp', desc: 'Sync email campaign metrics', connected: false, icon: '📧' },
  { name: 'HubSpot CRM', desc: 'Import contact and deal data', connected: false, icon: '🤝' },
  { name: 'Semrush', desc: 'Advanced SEO keyword data', connected: false, icon: '📈' },
  { name: 'Meta Business Suite', desc: 'Facebook & Instagram analytics', connected: true, icon: '📱' },
];

const Settings = () => {
  const { user } = useAuth();
  const [section, setSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('user_theme') || 'purple');
  const [notifs, setNotifs] = useState({ email: true, push: true, reports: true, tips: false, marketing: false });

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    localStorage.setItem('user_theme', themeId);
    document.body.classList.remove('theme-purple', 'theme-dark', 'theme-blue', 'theme-green', 'theme-light');
    document.body.classList.add(`theme-${themeId}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = user?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Settings</h1>
        <p className="text-slate-500 text-sm mt-0.5">Manage your account preferences and integrations</p>
      </div>

      <div className="flex gap-5 flex-col lg:flex-row">
        {/* Sidebar Nav */}
        <div className="lg:w-56 bg-white rounded-2xl border border-slate-100 shadow-sm p-3 h-fit">
          {sections.map(s => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all mb-0.5 ${section === s.id ? 'bg-violet-50 text-violet-700 border border-violet-100' : 'text-slate-500 hover:bg-slate-50'}`}>
              <s.icon className="h-4 w-4" />
              {s.label}
              {section === s.id && <ChevronRight className="h-3.5 w-3.5 ml-auto text-violet-400" />}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <AnimatePresence mode="wait">
            {/* Profile */}
            {section === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Profile Settings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Update your personal and business details</p>
                </div>
                {/* Avatar */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xl font-extrabold shadow-lg">
                    {initials}
                  </div>
                  <div>
                    <p className="text-base font-bold text-slate-800">{user?.full_name}</p>
                    <p className="text-sm text-slate-500">{user?.role || 'Marketing Consultant'}</p>
                    <button className="mt-1 text-xs text-violet-600 font-semibold hover:underline">Change Avatar</button>
                  </div>
                </div>
                {/* Fields */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', icon: User, placeholder: user?.full_name || 'Your Name', type: 'text' },
                    { label: 'Email Address', icon: Mail, placeholder: user?.email || 'email@company.com', type: 'email' },
                    { label: 'Phone Number', icon: Phone, placeholder: '+1 (555) 000-0000', type: 'tel' },
                    { label: 'Company Name', icon: Building, placeholder: 'Acme Marketing Agency', type: 'text' },
                    { label: 'Job Title', icon: User, placeholder: 'Growth Marketing Manager', type: 'text' },
                    { label: 'Location', icon: MapPin, placeholder: 'San Francisco, CA', type: 'text' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                      <div className="relative">
                        <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type={f.type} defaultValue={f.placeholder}
                          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Bio</label>
                  <textarea rows={3} defaultValue="Enterprise marketing consultant specializing in SaaS growth, SEO optimization, and data-driven strategies."
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-all" />
                </div>
                <div className="flex justify-end">
                  <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-all">
                    {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Changes</>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Notifications */}
            {section === 'notifications' && (
              <motion.div key="notifs" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Notification Preferences</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Choose what alerts and updates you receive</p>
                </div>
                <div className="space-y-1">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Notifications</p>
                    <Toggle enabled={notifs.email} onChange={v => setNotifs(p => ({...p, email: v}))} label="Email digest (weekly summary)" />
                    <Toggle enabled={notifs.reports} onChange={v => setNotifs(p => ({...p, reports: v}))} label="Report ready notifications" />
                    <Toggle enabled={notifs.marketing} onChange={v => setNotifs(p => ({...p, marketing: v}))} label="Product updates & news" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 mt-3">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">In-App Notifications</p>
                    <Toggle enabled={notifs.push} onChange={v => setNotifs(p => ({...p, push: v}))} label="Real-time audit alerts" />
                    <Toggle enabled={notifs.tips} onChange={v => setNotifs(p => ({...p, tips: v}))} label="AI tips & recommendations" />
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-all">
                    {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Preferences</>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Security */}
            {section === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Security Settings</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Protect your account with strong credentials</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type={showPass ? 'text' : 'password'} placeholder="••••••••"
                        className="w-full pl-9 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input type="password" placeholder="Minimum 8 characters"
                        className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Two-Factor Authentication</p>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Authenticator App</p>
                      <p className="text-xs text-slate-400 mt-0.5">Use Google Authenticator or Authy for extra security</p>
                    </div>
                    <button className="text-xs font-semibold text-violet-600 border border-violet-200 bg-violet-50 rounded-xl px-3 py-1.5 hover:bg-violet-100 transition-all">
                      Enable 2FA
                    </button>
                  </div>
                </div>
                <div className="flex justify-end">
                  <motion.button onClick={handleSave} whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-all">
                    {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Update Password</>}
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* Appearance */}
            {section === 'appearance' && (
              <motion.div key="appearance" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Appearance</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Customize the look and feel of your dashboard</p>
                </div>
                {saved && (
                  <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" /> Theme preferences saved successfully!
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Theme Selection</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {[
                      { id: 'purple', label: 'Purple Theme', icon: Palette, desc: 'Vibrant violet & indigo dashboard' },
                      { id: 'dark', label: 'Dark Mode', icon: Moon, desc: 'Sleek dark-slate workspace' },
                      { id: 'blue', label: 'Ocean Blue', icon: Globe, desc: 'Dynamic cyan & blue highlights' },
                      { id: 'green', label: 'Forest Green', icon: Zap, desc: 'Harmonious green & emerald theme' },
                      { id: 'light', label: 'Classic Light', icon: Sun, desc: 'Crisp layout with light borders' },
                    ].map(t => (
                      <button key={t.id} onClick={() => handleThemeChange(t.id)}
                        className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition-all ${theme === t.id ? 'border-violet-300 bg-violet-50/50 ring-2 ring-violet-100' : 'border-slate-100 hover:border-slate-200'}`}>
                        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${theme === t.id ? 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <t.icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{t.label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{t.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Integrations */}
            {section === 'integrations' && (
              <motion.div key="integrations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Connected Integrations</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Link third-party tools to enrich your marketing data</p>
                </div>
                <div className="space-y-3">
                  {integrations.map((int, i) => (
                    <motion.div key={int.name} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                      <span className="text-2xl">{int.icon}</span>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-800">{int.name}</p>
                        <p className="text-xs text-slate-400">{int.desc}</p>
                      </div>
                      <button className={`text-xs font-semibold rounded-xl px-3 py-1.5 border transition-all ${
                        int.connected
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-violet-50 text-violet-600 border-violet-200 hover:bg-violet-100'
                      }`}>
                        {int.connected ? '✓ Connected' : 'Connect'}
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Billing */}
            {section === 'billing' && (
              <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-5">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Billing & Plan</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your subscription and payment details</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-700 p-5 text-white">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">Pro Plan</span>
                    <span className="text-2xl font-extrabold">$49<span className="text-base font-medium opacity-70">/mo</span></span>
                  </div>
                  <p className="text-sm text-violet-200 mb-3">Unlimited audits, AI reports, and priority support</p>
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-yellow-300" />
                    <span>Next billing: July 9, 2026</span>
                  </div>
                </div>
                <div className="grid sm:grid-cols-3 gap-3">
                  {['Starter – $0/mo', 'Pro – $49/mo', 'Agency – $149/mo'].map((plan, i) => (
                    <div key={plan} className={`rounded-xl border p-4 text-center ${i === 1 ? 'border-violet-300 bg-violet-50' : 'border-slate-200 bg-slate-50'}`}>
                      <p className="text-sm font-bold text-slate-800">{plan.split(' – ')[0]}</p>
                      <p className="text-lg font-extrabold text-gradient">{plan.split(' – ')[1]}</p>
                      {i === 1 && <span className="text-[10px] font-bold text-violet-600 bg-violet-100 rounded-full px-2 py-0.5 mt-1 inline-block">Current Plan</span>}
                    </div>
                  ))}
                </div>
                <button className="w-full rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 hover:border-violet-300 hover:text-violet-600 hover:bg-violet-50 transition-all">
                  + Add Payment Method
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;

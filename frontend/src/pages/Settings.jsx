import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Bell, Shield, Palette, Globe, CreditCard,
  ChevronRight, CheckCircle, Save, Zap, Sun, Moon,
  Mail, Phone, Building, MapPin, Lock, Key, Eye, EyeOff,
  Calendar, Clock, AlertCircle, Loader2, Check, ShieldCheck
} from 'lucide-react';
import { businessAPI, subscriptionAPI } from '../services/api';

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
  const { user, accessStatus, refreshAccessStatus } = useAuth();
  const [section, setSection] = useState('profile');
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('user_theme') || 'purple');
  const [notifs, setNotifs] = useState({ email: true, push: true, reports: true, tips: false, marketing: false });
  const [businessProfile, setBusinessProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    company: '',
    title: 'Marketing Consultant',
    location: '',
    bio: 'Enterprise marketing consultant specializing in SaaS growth, SEO optimization, and data-driven strategies.'
  });

  // Billing state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null);

  const fetchPlans = useCallback(async () => {
    setPlansLoading(true);
    try {
      const data = await subscriptionAPI.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setPlansLoading(false);
    }
  }, []);

  useEffect(() => {
    if (section === 'billing') fetchPlans();
  }, [section, fetchPlans]);

  React.useEffect(() => {
    if (!user) return;

    let isMounted = true;
    businessAPI.getProfiles().then(profiles => {
      if (!isMounted) return;
      if (profiles.length > 0) {
        const bp = profiles[0];
        setBusinessProfile(bp);
        setProfileForm({
          full_name: user.full_name || '',
          email: user.email || '',
          phone: bp.contact_number || '',
          company: bp.business_name || '',
          title: 'Marketing Consultant',
          location: bp.business_location || '',
          bio: bp.description || 'Enterprise marketing consultant specializing in SaaS growth, SEO optimization, and data-driven strategies.'
        });
      } else {
        setProfileForm(p => ({
          ...p,
          full_name: user.full_name || '',
          email: user.email || ''
        }));
      }
    }).catch(() => {
      if (isMounted) {
        setProfileForm(p => ({
          ...p,
          full_name: user.full_name || '',
          email: user.email || ''
        }));
      }
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    localStorage.setItem('user_theme', themeId);
    document.body.classList.remove('theme-purple', 'theme-dark', 'theme-blue', 'theme-green', 'theme-light');
    document.body.classList.add(`theme-${themeId}`);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const handleSave = async () => {
    if (section === 'profile') {
      try {
        if (businessProfile) {
          await businessAPI.updateProfile(businessProfile.id, {
            contact_number: profileForm.phone,
            business_name: profileForm.company,
            business_location: profileForm.location,
            description: profileForm.bio
          });
        } else {
          const newProfile = await businessAPI.createProfile({
            business_name: profileForm.company || 'My Business',
            contact_number: profileForm.phone,
            business_location: profileForm.location,
            description: profileForm.bio,
            business_category: 'Other',
            industry_type: 'Other',
            website_url: '',
            target_audience: 'General',
            email: profileForm.email,
          });
          setBusinessProfile(newProfile);
        }
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      } catch (err) {
        console.error("Failed to update profile", err);
      }
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const handleInputChange = (field, value) => {
    setProfileForm(p => ({ ...p, [field]: value }));
  };

  const loadRazorpayScript = () =>
    new Promise(resolve => {
      if (document.getElementById('rzp-sdk')) return resolve(true);
      const s = document.createElement('script');
      s.id = 'rzp-sdk';
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const handleSubscribe = async (plan) => {
    setProcessingPlan(plan.plan_name);
    try {
      const orderData = await subscriptionAPI.createOrder(plan.plan_name);

      if (orderData.is_mock) {
        const ok = window.confirm(
          `[DEV MODE] Simulating payment for "${plan.plan_name}" (₹${plan.price}).\nClick OK to activate.`
        );
        if (!ok) { setProcessingPlan(null); return; }
        const res = await subscriptionAPI.verifyPayment({
          plan_name: plan.plan_name,
          amount: plan.price,
          duration_days: plan.duration_days,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `mock_pay_${Math.random().toString(36).substr(2, 8)}`,
          razorpay_signature: 'mock_ok',
        });
        if (res.success) { await refreshAccessStatus(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
        return;
      }

      const loaded = await loadRazorpayScript();
      if (!loaded) { alert('Could not load payment gateway.'); return; }

      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'MarketerAI SaaS',
        description: `${plan.plan_name} Plan — ₹${Number(plan.price).toLocaleString('en-IN')} / ${plan.duration_days} days`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const res = await subscriptionAPI.verifyPayment({
              plan_name: plan.plan_name,
              amount: plan.price,
              duration_days: plan.duration_days,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (res.success) { await refreshAccessStatus(); setSaved(true); setTimeout(() => setSaved(false), 3000); }
          } catch (e) { alert('Verification failed: ' + (e.response?.data?.detail || e.message)); }
        },
        prefill: { name: user?.full_name || '', email: user?.email || '' },
        theme: { color: '#7c3aed' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Order creation failed: ' + (err.response?.data?.detail || 'Server error.'));
    } finally {
      setProcessingPlan(null);
    }
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
          {sections.filter(s => s.id !== 'billing' || user?.role !== 'admin').map(s => (
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
                    { label: 'Full Name', field: 'full_name', icon: User, type: 'text' },
                    { label: 'Email Address', field: 'email', icon: Mail, type: 'email', disabled: true },
                    { label: 'Phone Number', field: 'phone', icon: Phone, placeholder: '+1 (555) 000-0000', type: 'tel' },
                    { label: 'Company Name', field: 'company', icon: Building, placeholder: 'Acme Marketing Agency', type: 'text' },
                    { label: 'Job Title', field: 'title', icon: User, placeholder: 'Growth Marketing Manager', type: 'text' },
                    { label: 'Location', field: 'location', icon: MapPin, placeholder: 'San Francisco, CA', type: 'text' },
                  ].map(f => (
                    <div key={f.label}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{f.label}</label>
                      <div className="relative">
                        <f.icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input type={f.type} value={profileForm[f.field]} onChange={(e) => handleInputChange(f.field, e.target.value)}
                          disabled={f.disabled}
                          placeholder={f.placeholder}
                          className={`w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all ${f.disabled ? 'opacity-70 cursor-not-allowed' : 'focus:bg-white'}`} />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Bio & Description</label>
                  <textarea rows={3} value={profileForm.bio} onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="w-full px-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 resize-none transition-all focus:bg-white" />
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
            {section === 'billing' && user?.role !== 'admin' && (
              <motion.div key="billing" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-6 space-y-6">
                <div>
                  <h2 className="text-base font-bold text-slate-800">Billing &amp; Plan</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Manage your subscription and payment details</p>
                </div>

                {/* Payment success toast */}
                {saved && (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-xl px-4 py-3 text-sm font-semibold">
                    <CheckCircle className="h-4 w-4 shrink-0" /> Subscription activated successfully!
                  </div>
                )}

                {/* Active Plan Status Card */}
                {accessStatus && (
                  <div className={`rounded-2xl p-5 text-white ${
                    !accessStatus.has_access
                      ? 'bg-gradient-to-br from-red-500 to-rose-600'
                      : accessStatus.subscription_active
                      ? 'bg-gradient-to-br from-violet-600 to-indigo-700'
                      : 'bg-gradient-to-br from-amber-500 to-orange-500'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {accessStatus.has_access
                          ? <ShieldCheck className="h-5 w-5" />
                          : <AlertCircle className="h-5 w-5 animate-pulse" />}
                        <span className="text-sm font-bold bg-white/20 px-3 py-1 rounded-full">
                          {!accessStatus.has_access
                            ? 'Access Expired'
                            : accessStatus.subscription_active
                            ? accessStatus.subscription_plan || 'Active Plan'
                            : `Free Trial`}
                        </span>
                      </div>
                      {accessStatus.trial_active && !accessStatus.subscription_active && (
                        <span className="text-2xl font-extrabold">
                          {accessStatus.trial_days_left}
                          <span className="text-sm font-medium opacity-70"> days left</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {accessStatus.subscription_active && accessStatus.subscription_expiry && (
                        <>
                          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                            <Calendar className="h-4 w-4 opacity-80" />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider opacity-70">Expiry Date</p>
                              <p className="font-bold text-sm">
                                {new Date(accessStatus.subscription_expiry).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 bg-white/10 rounded-xl p-3">
                            <Clock className="h-4 w-4 opacity-80" />
                            <div>
                              <p className="text-[10px] uppercase tracking-wider opacity-70">Days Remaining</p>
                              <p className="font-bold text-sm">
                                {Math.max(0, Math.ceil(
                                  (new Date(accessStatus.subscription_expiry) - new Date()) / (1000 * 60 * 60 * 24)
                                ))} days
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                      {accessStatus.trial_active && !accessStatus.subscription_active && (
                        <div className="col-span-2 flex items-center gap-2">
                          <Zap className="h-4 w-4 text-yellow-300" />
                          <span>Trial started from account registration date</span>
                        </div>
                      )}
                      {!accessStatus.has_access && (
                        <div className="col-span-2 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          <span>Your free trial has ended. Choose a plan below to restore access.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Plans Grid */}
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Available Plans</p>
                  {plansLoading ? (
                    <div className="flex items-center justify-center py-10 gap-3 text-slate-400 text-sm">
                      <Loader2 className="h-5 w-5 animate-spin" /> Loading plans...
                    </div>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {plans.map((plan) => {
                        const isActive = accessStatus?.subscription_active &&
                          accessStatus?.subscription_plan === plan.plan_name;
                        const isProcessing = processingPlan === plan.plan_name;
                        return (
                          <motion.div
                            key={plan.id}
                            whileHover={{ y: -2 }}
                            className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                              isActive
                                ? 'border-violet-300 bg-violet-50 ring-2 ring-violet-100'
                                : 'border-slate-100 bg-slate-50 hover:border-violet-200 hover:bg-violet-50/30'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-sm font-extrabold text-slate-800">{plan.plan_name}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5">{plan.duration_days} days access</p>
                              </div>
                              {isActive && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-100 px-2 py-0.5 rounded-full border border-violet-200">
                                  <Check className="h-3 w-3" /> Active
                                </span>
                              )}
                            </div>
                            {plan.description && (
                              <p className="text-[11px] text-slate-400 leading-relaxed">{plan.description}</p>
                            )}
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-slate-800">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                              <span className="text-slate-400 text-xs">/ {plan.plan_name}</span>
                            </div>
                            <button
                              onClick={() => handleSubscribe(plan)}
                              disabled={!!processingPlan || isActive}
                              className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                                isActive
                                  ? 'bg-violet-100 text-violet-600 cursor-default'
                                  : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/10'
                              } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                              {isProcessing ? (
                                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Processing...</>
                              ) : isActive ? (
                                <><Check className="h-3.5 w-3.5" /> Current Plan</>
                              ) : (
                                <><CreditCard className="h-3.5 w-3.5" /> Buy Now — ₹{Number(plan.price).toLocaleString('en-IN')}</>
                              )}
                            </button>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 text-center">
                  Payments are secured by Razorpay. Plans activate instantly after verification.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Settings;

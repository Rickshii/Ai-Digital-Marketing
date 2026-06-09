import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, CheckCircle } from 'lucide-react';

const perks = [
  'AI Marketing Strategy Generator',
  'Website & SEO Auditing Engine',
  'Social Media Performance Tracker',
  'Monthly Growth Reports & Analytics',
];

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await register(email, fullName, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      <motion.div
        initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 relative flex-col justify-between p-12 overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold">MarketerAI</span>
        </div>

        <div className="relative z-10">
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-3">
            Start Growing<br />Your Brand<br /><span className="text-yellow-300">Today</span>
          </h2>
          <p className="text-violet-200 text-sm leading-relaxed mb-8 max-w-xs">
            Join 500+ businesses using AI to dominate their market. Free to start.
          </p>
          <div className="space-y-3">
            {perks.map((perk, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + i * 0.1 }} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-violet-100 text-sm">{perk}</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative z-10 rounded-2xl bg-white/10 border border-white/15 p-4">
          <p className="text-white text-xs font-medium">"MarketerAI transformed our SEO strategy in just 2 weeks!"</p>
          <p className="text-violet-300 text-[10px] mt-1">— Sarah K., Growth Manager at TechFlow</p>
        </div>
      </motion.div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800 text-xl font-bold">MarketerAI</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-800">Create your account</h1>
            <p className="text-slate-500 text-sm mt-1">Get started free — no credit card required</p>
          </div>

          {error && <div className="mb-5 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-600">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Sarah Jenkins"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com"
                  className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters"
                  className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" />
                <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 flex items-center gap-1">
                  {[1,2,3,4].map(n => (
                    <div key={n} className={`flex-1 h-1 rounded-full transition-all ${strength >= n ? (strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-200'}`} />
                  ))}
                  <span className="ml-2 text-xs text-slate-400">{['', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</span>
                </div>
              )}
            </div>
            <div className="flex items-start gap-2">
              <input type="checkbox" required className="mt-0.5 rounded border-slate-300 text-violet-500" />
              <span className="text-xs text-slate-500">I agree to the <span className="text-violet-600 font-semibold cursor-pointer">Terms of Service</span> and <span className="text-violet-600 font-semibold cursor-pointer">Privacy Policy</span></span>
            </div>
            <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 hover:opacity-95 transition-all disabled:opacity-60">
              {loading ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
            </motion.button>
          </form>

          <p className="text-center text-sm text-slate-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-violet-600 font-semibold hover:underline">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

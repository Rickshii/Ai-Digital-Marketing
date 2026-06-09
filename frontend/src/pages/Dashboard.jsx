import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI, auditAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, ArrowRight, Globe, Briefcase, Search,
  Share2, Megaphone, Zap, CheckCircle, AlertTriangle, Clock,
  Users, BarChart2, Activity, Star
} from 'lucide-react';

// ── Circular Progress Chart ────────────────────────────────────
const CircularScore = ({ score, label, color, size = 100 }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  const colorMap = {
    purple: { stroke: '#8B5CF6', text: 'text-violet-600', bg: 'bg-violet-50' },
    indigo: { stroke: '#6366F1', text: 'text-indigo-600', bg: 'bg-indigo-50' },
    cyan: { stroke: '#06B6D4', text: 'text-cyan-600', bg: 'bg-cyan-50' },
    emerald: { stroke: '#10B981', text: 'text-emerald-600', bg: 'bg-emerald-50' },
    amber: { stroke: '#F59E0B', text: 'text-amber-600', bg: 'bg-amber-50' },
    rose: { stroke: '#F43F5E', text: 'text-rose-600', bg: 'bg-rose-50' },
  };

  const c = colorMap[color] || colorMap.purple;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className={`relative flex items-center justify-center rounded-full ${c.bg} p-2`} style={{ width: size, height: size }}>
        <svg width={size - 8} height={size - 8} viewBox="0 0 96 96" className="-rotate-90">
          <circle cx="48" cy="48" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" />
          <motion.circle
            cx="48" cy="48" r={r}
            fill="none"
            stroke={c.stroke}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-lg font-extrabold ${c.text}`}>{score}</span>
          <span className="text-[9px] text-slate-400 font-medium">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold text-slate-600 text-center leading-tight">{label}</span>
    </div>
  );
};

// ── KPI Card ────────────────────────────────────────────────
const KpiCard = ({ title, value, unit, icon: Icon, iconBg, trend, trendValue, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
    className="glass-card glass-card-hover bg-white rounded-2xl p-5 shadow-sm border border-slate-100"
  >
    <div className="flex items-start justify-between mb-4">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <span className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
        trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
      }`}>
        {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        {trendValue}
      </span>
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{title}</p>
      <p className="text-2xl font-extrabold text-slate-800 mt-1">
        {value}<span className="text-sm font-medium text-slate-400 ml-1">{unit}</span>
      </p>
    </div>
    <div className="mt-3 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-violet-400 to-indigo-500"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(parseInt(value), 100)}%` }}
        transition={{ duration: 1.1, ease: 'easeOut', delay: delay + 0.3 }}
      />
    </div>
  </motion.div>
);

// ── Mini Trend Bars ─────────────────────────────────────────
const TrendBars = ({ data }) => (
  <div className="flex items-end gap-1 h-10">
    {data.map((v, i) => (
      <motion.div
        key={i}
        className="flex-1 rounded-sm bg-gradient-to-t from-violet-400 to-indigo-400 opacity-70"
        initial={{ height: 0 }}
        animate={{ height: `${v}%` }}
        transition={{ delay: i * 0.05, duration: 0.4 }}
        style={{ maxHeight: '100%', minHeight: 4 }}
      />
    ))}
  </div>
);

// ── Activity Skeleton ────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse rounded-lg bg-slate-100 ${className}`} />
);

// ────────────────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profilesData, auditsData] = await Promise.all([
          businessAPI.getProfiles(),
          auditAPI.getHistory()
        ]);
        setProfiles(profilesData);
        setAudits(auditsData);
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const avg = (arr, key) => arr.length ? Math.round(arr.reduce((s, x) => s + (x[key] || 0), 0) / arr.length) : 0;

  const avgBusiness = avg(profiles, 'completeness_score');
  const avgHealth = avg(audits, 'health_score');
  const avgSeo = avg(audits, 'seo_score');
  const avgSocial = avg(audits, 'social_score');
  const avgMarketing = avg(audits, 'marketing_score');

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const getScoreColor = (s) => s >= 80 ? 'emerald' : s >= 55 ? 'amber' : 'rose';

  const trendBarsData = [40, 55, 45, 70, 60, 82, 75, 90, 85, 92, 88, 95];

  const quickActions = [
    { label: 'Run SEO Audit', path: '/seo', icon: Search, color: 'bg-gradient-to-br from-emerald-400 to-teal-500' },
    { label: 'Analyze Website', path: '/audit', icon: Globe, color: 'bg-gradient-to-br from-cyan-400 to-blue-500' },
    { label: 'View Strategy', path: '/strategy', icon: Megaphone, color: 'bg-gradient-to-br from-amber-400 to-orange-500' },
    { label: 'Download Report', path: '/reports', icon: BarChart2, color: 'bg-gradient-to-br from-violet-400 to-purple-600' },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* ── Welcome Banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 px-6 py-7 md:px-8 md:py-9 shadow-xl shadow-violet-500/20"
      >
        {/* Decorative blobs */}
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute top-4 right-6 opacity-20">
          <Zap className="h-24 w-24 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-violet-200 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, <span className="text-yellow-300">{user?.full_name?.split(' ')[0]}!</span>
            </h1>
            <p className="text-violet-200 text-sm mt-1.5 max-w-lg">
              Your marketing console is active. {profiles.length} business profiles and {audits.length} website audits are ready for review.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/business" className="flex items-center gap-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition-all backdrop-blur-sm">
              <Briefcase className="h-4 w-4" />
              <span>Add Business</span>
            </Link>
            <Link to="/audit" className="flex items-center gap-2 rounded-xl bg-white text-violet-700 px-4 py-2.5 text-sm font-semibold hover:bg-violet-50 transition-all shadow">
              <Activity className="h-4 w-4" />
              <span>Run Audit</span>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* ── Score Circles ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-bold text-slate-800">Overall Performance Scores</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time scores computed from your connected data</p>
          </div>
          <Link to="/reports" className="flex items-center gap-1 text-xs font-semibold text-violet-600 hover:underline">
            Full Report <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        {loading ? (
          <div className="flex gap-8 justify-around">
            {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-28 w-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 justify-items-center">
            <CircularScore score={avgBusiness} label="Business Profile" color={getScoreColor(avgBusiness)} size={108} />
            <CircularScore score={avgHealth} label="Website Health" color={getScoreColor(avgHealth)} size={108} />
            <CircularScore score={avgSeo} label="SEO Score" color={getScoreColor(avgSeo)} size={108} />
            <CircularScore score={avgSocial} label="Social Media" color={getScoreColor(avgSocial)} size={108} />
            <CircularScore score={avgMarketing} label="Marketing" color={getScoreColor(avgMarketing)} size={108} />
          </div>
        )}
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          title="Business Profiles" value={profiles.length} unit="active"
          icon={Briefcase} iconBg="bg-gradient-to-br from-violet-500 to-purple-600"
          trend="up" trendValue="+2 this month" delay={0}
        />
        <KpiCard
          title="Website Audits" value={audits.length} unit="total"
          icon={Globe} iconBg="bg-gradient-to-br from-cyan-500 to-blue-500"
          trend="up" trendValue="+5 this week" delay={0.08}
        />
        <KpiCard
          title="Avg SEO Score" value={avgSeo || '—'} unit={avgSeo ? '/100' : ''}
          icon={Search} iconBg="bg-gradient-to-br from-emerald-500 to-teal-600"
          trend={avgSeo >= 70 ? 'up' : 'down'} trendValue={avgSeo >= 70 ? '+8pts' : '-3pts'} delay={0.16}
        />
        <KpiCard
          title="Marketing Score" value={avgMarketing || '—'} unit={avgMarketing ? '/100' : ''}
          icon={Megaphone} iconBg="bg-gradient-to-br from-amber-500 to-orange-500"
          trend="up" trendValue="+12pts" delay={0.24}
        />
      </div>

      {/* ── Activity + Quick Actions ── */}
      <div className="grid gap-5 lg:grid-cols-3">
        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-bold text-slate-800">Marketing Performance Trend</h3>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <TrendingUp className="h-3 w-3" /> +18% this quarter
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-5">12-week rolling performance index</p>
          <div className="flex items-end gap-2 h-32 w-full">
            {trendBarsData.map((v, i) => (
              <motion.div
                key={i}
                className="flex-1 rounded-t-sm"
                style={{
                  background: `linear-gradient(to top, #8B5CF6, #6366F1)`,
                  opacity: 0.6 + i * 0.03
                }}
                initial={{ height: 0 }}
                animate={{ height: `${v}%` }}
                transition={{ delay: i * 0.06, duration: 0.5, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-slate-400">
            {['W1','W2','W3','W4','W5','W6','W7','W8','W9','W10','W11','W12'].map(w => (
              <span key={w}>{w}</span>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-slate-800 mb-1">Quick Actions</h3>
          <p className="text-xs text-slate-400 mb-4">Launch key tools instantly</p>
          <div className="space-y-2">
            {quickActions.map((action) => (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm ${action.color}`}>
                  <action.icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">{action.label}</span>
                <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 ml-auto transition-all group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Recent Audits + Profiles ── */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Recent Audits */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Globe className="h-4 w-4 text-cyan-500" />
              Recent Website Audits
            </h3>
            <Link to="/audit" className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </div>
              ))
            ) : audits.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Globe className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No audits yet.</p>
                <Link to="/audit" className="text-xs text-violet-600 font-semibold mt-1 inline-block hover:underline">Run your first audit →</Link>
              </div>
            ) : (
              audits.slice(0, 4).map((audit) => {
                const score = audit.health_score;
                const scoreColor = score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 55 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                return (
                  <div key={audit.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-all">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
                      <Globe className="h-4 w-4 text-cyan-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{audit.title || audit.website_url}</p>
                      <p className="text-xs text-slate-400 truncate">{audit.website_url}</p>
                    </div>
                    <div className={`flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-bold ${scoreColor}`}>
                      {score}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Business Profiles */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-violet-500" />
              Business Profiles
            </h3>
            <Link to="/business" className="text-xs text-violet-600 font-semibold hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-6 py-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-2 w-20" />
                  </div>
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </div>
              ))
            ) : profiles.length === 0 ? (
              <div className="px-6 py-10 text-center">
                <Briefcase className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                <p className="text-sm text-slate-400">No profiles yet.</p>
                <Link to="/business" className="text-xs text-violet-600 font-semibold mt-1 inline-block hover:underline">Create a business profile →</Link>
              </div>
            ) : (
              profiles.slice(0, 4).map((profile) => {
                const score = profile.completeness_score;
                const scoreColor = score >= 80 ? 'text-emerald-600 bg-emerald-50' : score >= 55 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
                return (
                  <div key={profile.id} className="flex items-center gap-3 px-6 py-3.5 hover:bg-slate-50 transition-all">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
                      <Briefcase className="h-4 w-4 text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{profile.business_name}</p>
                      <p className="text-xs text-violet-500 font-medium truncate">{profile.industry_type}</p>
                    </div>
                    <div className={`flex items-center justify-center rounded-lg px-2.5 py-1 text-sm font-bold ${scoreColor}`}>
                      {score}%
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ── Recommendations Feed ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 text-white shadow-sm">
            <Star className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-800">AI Recommendations</h3>
            <p className="text-xs text-slate-400">Top priority insights from your marketing data</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: CheckCircle, color: 'text-emerald-500 bg-emerald-50', title: 'SEO Optimization Ready', desc: 'Your website\'s technical score is above 85. Start link building campaigns for faster SERP gains.' },
            { icon: AlertTriangle, color: 'text-amber-500 bg-amber-50', title: 'Social Presence Gaps', desc: 'LinkedIn is underutilized. Post 3x weekly to increase B2B leads from professional audiences.' },
            { icon: Clock, color: 'text-blue-500 bg-blue-50', title: 'Content Calendar Due', desc: 'Next quarter\'s editorial plan should be finalized. Create 30-day content blocks for consistency.' },
          ].map((rec, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-3 p-4 rounded-xl border border-slate-100 hover:border-violet-100 hover:bg-violet-50/30 transition-all cursor-default"
            >
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${rec.color}`}>
                <rec.icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{rec.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{rec.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

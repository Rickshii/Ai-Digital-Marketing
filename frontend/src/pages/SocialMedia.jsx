import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Share2, Users, CheckCircle, XCircle, AlertTriangle,
  Globe, Link2, MessageCircle, Clock, RefreshCw, TrendingUp,
  ArrowUp, BarChart2, Lightbulb, Activity
} from 'lucide-react';
import { socialAPI } from '../services/api';

/* ─── SVG brand icons ─────────────────────────────────────────────────────── */
const FbIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IgIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const LiIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);
const YtIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const PLATFORMS = [
  { key: 'facebook',  label: 'Facebook',  Icon: FbIcon, grad: 'from-blue-600 to-blue-700',   field: 'facebook_url',  placeholder: 'https://facebook.com/yourpage'  },
  { key: 'instagram', label: 'Instagram', Icon: IgIcon, grad: 'from-pink-500 to-rose-500',   field: 'instagram_url', placeholder: 'https://instagram.com/yourhandle'},
  { key: 'linkedin',  label: 'LinkedIn',  Icon: LiIcon, grad: 'from-sky-600 to-blue-600',    field: 'linkedin_url',  placeholder: 'https://linkedin.com/company/x' },
  { key: 'youtube',   label: 'YouTube',   Icon: YtIcon, grad: 'from-red-500 to-rose-600',    field: 'youtube_url',   placeholder: 'https://youtube.com/c/yourchannel'},
];

/* ─── Helpers ─────────────────────────────────────────────────────────────── */
const scoreColor  = (s) => s >= 75 ? '#10b981' : s >= 50 ? '#f59e0b' : '#ef4444';
const scoreLabel  = (s) => s >= 75 ? 'Strong' : s >= 50 ? 'Moderate' : 'Weak';

const Ring = ({ score, size = 110 }) => {
  const r = (size - 14) / 2, circ = 2 * Math.PI * r, dash = (score / 100) * circ;
  const c = scoreColor(score);
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
      <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={c} strokeWidth={10}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: circ - dash }}
        transition={{ duration: 1.2, ease: 'easeOut' }} />
      <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
        style={{ transform: `rotate(90deg) translate(0px,-${size}px)`, transformOrigin: `${size/2}px ${size/2}px`,
          fill: c, fontSize: size * 0.22, fontWeight: 800 }}>
        {score}
      </text>
    </svg>
  );
};

const BoolChip = ({ v, yes, no }) => v
  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5"><CheckCircle className="h-3 w-3" />{yes}</span>
  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-full px-2 py-0.5"><XCircle className="h-3 w-3" />{no}</span>;

const MiniBar = ({ pct, color }) => (
  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden w-full">
    <motion.div className={`h-full rounded-full ${color}`}
      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
      transition={{ duration: 0.9, ease: 'easeOut' }} />
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════ */
const SocialMedia = () => {
  const [urls, setUrls]       = useState({ facebook_url: '', instagram_url: '', linkedin_url: '', youtube_url: '' });
  const [loading, setLoad]    = useState(false);
  const [data, setData]       = useState(null);
  const [history, setHistory] = useState([]);
  const [selected, setSelected] = useState('facebook');
  const [tab, setTab]         = useState('overview');
  const [error, setError]     = useState('');

  useEffect(() => {
    socialAPI.getHistory().then(h => {
      setHistory(h);
      if (h.length) { setData(h[0]); prefillUrls(h[0]); }
    }).catch(() => {});
  }, []);

  const prefillUrls = (d) => setUrls({
    facebook_url:  d.facebook_url  || '',
    instagram_url: d.instagram_url || '',
    linkedin_url:  d.linkedin_url  || '',
    youtube_url:   d.youtube_url   || '',
  });

  const handleRun = async (e) => {
    e.preventDefault();
    const hasAny = Object.values(urls).some(v => v.trim());
    if (!hasAny) { setError('Enter at least one social media profile URL.'); return; }
    setLoad(true); setError(''); setData(null);
    try {
      const res = await socialAPI.runAnalysis(urls);
      setData(res);
      setHistory(prev => [res, ...prev.filter(x => x.id !== res.id)]);
      setTab('overview');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Analysis failed. Please try again.');
    } finally { setLoad(false); }
  };

  const platformResult = (key) => {
    if (!data) return null;
    return data[`${key}_analysis`] || null;
  };

  const perScores = data?.analysis_summary?.per_platform_scores || {};
  const missing   = data?.missing_elements   || [];
  const suggests  = data?.growth_suggestions || [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Social Media Analysis</h1>
        <p className="text-slate-500 text-sm mt-0.5">Multi-platform profile audit, completeness scoring & growth suggestions — Module 5</p>
      </div>

      {/* Input form */}
      <form onSubmit={handleRun} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Share2 className="h-4 w-4 text-violet-500" /> Enter Social Media Profile URLs
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {PLATFORMS.map(({ key, label, Icon, field, placeholder, grad }) => (
            <div key={key} className="relative">
              <div className={`absolute left-3 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-lg bg-gradient-to-br ${grad} text-white`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <input value={urls[field]} onChange={e => setUrls(u => ({ ...u, [field]: e.target.value }))}
                placeholder={placeholder}
                className="w-full pl-12 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
              />
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-red-500 flex items-center gap-1 mb-3"><XCircle className="h-3.5 w-3.5" />{error}</p>}
        <motion.button type="submit" disabled={loading} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Activity className="h-4 w-4" />}
          {loading ? 'Analysing platforms…' : 'Run Social Analysis'}
        </motion.button>
        {loading && (
          <div className="mt-4 space-y-1.5">
            {PLATFORMS.map(({ label }, i) => (
              <motion.p key={label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.5 }}
                className="text-xs text-slate-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />Checking {label} profile…
              </motion.p>
            ))}
          </div>
        )}
      </form>

      {/* History pills */}
      {history.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {history.slice(0, 5).map(h => (
            <button key={h.id} onClick={() => { setData(h); prefillUrls(h); }}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${data?.id === h.id ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200'}`}>
              <Clock className="h-3 w-3 inline mr-1" />
              {new Date(h.created_at).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      <AnimatePresence>
      {data && (
        <motion.div key={data.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

          {/* KPI row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Social Score',        val: data.social_score,       icon: TrendingUp, grad: 'from-violet-500 to-purple-600' },
              { label: 'Profile Completeness', val: `${data.profile_completeness}%`, icon: CheckCircle, grad: 'from-emerald-500 to-teal-500' },
              { label: 'Platforms Found',      val: data.platforms_found,   icon: Share2,     grad: 'from-cyan-500 to-blue-500'    },
              { label: 'Missing Elements',     val: missing.length,         icon: AlertTriangle, grad: 'from-amber-500 to-orange-500' },
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${k.grad} text-white shadow`}>
                  <k.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-slate-800">{k.val}</p>
                  <p className="text-xs text-slate-400">{k.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 px-4 pt-4 gap-1 overflow-x-auto">
              {[
                { id: 'overview',  label: 'Overview',          icon: BarChart2    },
                { id: 'platforms', label: 'Platform Details',   icon: Share2       },
                { id: 'missing',   label: 'Missing Elements',   icon: AlertTriangle },
                { id: 'growth',    label: 'Growth Suggestions', icon: Lightbulb    },
              ].map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 whitespace-nowrap transition-all ${tab === t.id ? 'border-violet-500 text-violet-600 bg-violet-50/60' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">

                {/* Overview */}
                {tab === 'overview' && (
                  <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid md:grid-cols-2 gap-6">
                    {/* Ring + score */}
                    <div className="flex flex-col items-center gap-4 py-4">
                      <Ring score={data.social_score} size={140} />
                      <div className="text-center">
                        <p className="text-lg font-extrabold text-slate-800">{scoreLabel(data.social_score)} Social Presence</p>
                        <p className="text-xs text-slate-400 mt-0.5">Based on {data.platforms_analyzed} platform(s) analysed</p>
                      </div>
                    </div>
                    {/* Per-platform bars */}
                    <div className="space-y-4 py-4">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Platform Completeness</p>
                      {PLATFORMS.map(({ key, label, Icon, grad }) => {
                        const score = perScores[key] || 0;
                        return (
                          <div key={key}>
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className={`h-6 w-6 flex items-center justify-center rounded-md bg-gradient-to-br ${grad} text-white`}>
                                <Icon className="h-3 w-3" />
                              </div>
                              <span className="text-xs font-semibold text-slate-700 flex-1">{label}</span>
                              <span className="text-xs font-bold" style={{ color: scoreColor(score) }}>{score}%</span>
                            </div>
                            <MiniBar pct={score} color={`bg-gradient-to-r ${grad}`} />
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {/* Platform details */}
                {tab === 'platforms' && (
                  <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Platform selector */}
                    <div className="flex gap-2 mb-5 flex-wrap">
                      {PLATFORMS.map(({ key, label, Icon, grad }) => (
                        <button key={key} onClick={() => setSelected(key)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${selected === key ? 'bg-violet-50 border-violet-300 text-violet-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-violet-200'}`}>
                          <div className={`h-5 w-5 flex items-center justify-center rounded bg-gradient-to-br ${grad} text-white`}>
                            <Icon className="h-2.5 w-2.5" />
                          </div>
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Selected platform detail */}
                    {(() => {
                      const res = platformResult(selected);
                      const plat = PLATFORMS.find(p => p.key === selected);
                      if (!res) return (
                        <div className="rounded-xl bg-slate-50 border border-dashed border-slate-200 p-8 text-center">
                          <plat.Icon className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                          <p className="text-sm text-slate-400">No URL provided for {plat.label}</p>
                        </div>
                      );
                      return (
                        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                          {/* Header */}
                          <div className="flex items-center gap-3">
                            <div className={`h-12 w-12 flex items-center justify-center rounded-xl bg-gradient-to-br ${plat.grad} text-white shadow`}>
                              <plat.Icon className="h-6 w-6" />
                            </div>
                            <div>
                              <h3 className="font-bold text-slate-800">{plat.label} Profile</h3>
                              <a href={res.url} target="_blank" rel="noopener noreferrer"
                                className="text-xs text-violet-500 hover:underline">{res.url}</a>
                            </div>
                            <div className="ml-auto">
                              <Ring score={res.completeness_score} size={72} />
                            </div>
                          </div>

                          {/* Booleans */}
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {[
                              { label: 'Reachable',       val: res.reachable,            yes: 'Reachable',    no: 'Not Reachable'    },
                              { label: 'Profile Found',   val: res.profile_found,        yes: 'Found',        no: 'Not Found'        },
                              { label: 'Bio / About',     val: res.has_bio,              yes: 'Present',      no: 'Missing'          },
                              { label: 'Contact Info',    val: res.has_contact,          yes: 'Found',        no: 'Missing'          },
                              { label: 'Website Link',    val: res.has_website_link,     yes: 'Set',          no: 'Missing'          },
                              { label: 'Recent Activity', val: res.has_recent_activity,  yes: 'Active',       no: 'Inactive'         },
                            ].map(({ label, val, yes, no }) => (
                              <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">{label}</p>
                                <BoolChip v={val} yes={yes} no={no} />
                              </div>
                            ))}
                          </div>

                          {/* Stats */}
                          {(res.followers || res.posts_count || res.posting_frequency) && (
                            <div className="grid grid-cols-3 gap-3">
                              {res.followers && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">Followers</p>
                                  <p className="text-lg font-extrabold text-slate-800">{res.followers}</p>
                                </div>
                              )}
                              {res.posts_count && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">Posts</p>
                                  <p className="text-lg font-extrabold text-slate-800">{res.posts_count}</p>
                                </div>
                              )}
                              {res.posting_frequency && (
                                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
                                  <p className="text-[10px] text-slate-400 font-medium uppercase mb-1">Frequency</p>
                                  <p className="text-xs font-bold text-slate-700 mt-1">{res.posting_frequency}</p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Strengths & Issues */}
                          <div className="grid sm:grid-cols-2 gap-4">
                            {res.strengths?.length > 0 && (
                              <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
                                <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> Strengths</p>
                                <ul className="space-y-1">
                                  {res.strengths.map((s, i) => <li key={i} className="text-xs text-emerald-800">• {s}</li>)}
                                </ul>
                              </div>
                            )}
                            {res.issues?.length > 0 && (
                              <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                                <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Issues</p>
                                <ul className="space-y-1">
                                  {res.issues.map((s, i) => <li key={i} className="text-xs text-red-800">• {s}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })()}
                  </motion.div>
                )}

                {/* Missing elements */}
                {tab === 'missing' && (
                  <motion.div key="miss" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {missing.length === 0
                      ? <p className="text-sm text-emerald-600 flex items-center gap-2 py-4"><CheckCircle className="h-4 w-4" />No missing elements detected — all profiles are well-configured!</p>
                      : missing.map((m, i) => (
                          <motion.div key={i} initial={{ opacity: 0, x: 6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-100 p-3.5">
                            <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-slate-700">{m}</p>
                          </motion.div>
                        ))}
                  </motion.div>
                )}

                {/* Growth suggestions */}
                {tab === 'growth' && (
                  <motion.div key="grow" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {suggests.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 rounded-xl bg-violet-50 border border-violet-100 p-3.5">
                        <TrendingUp className="h-4 w-4 text-violet-500 mt-0.5 shrink-0" />
                        <p className="text-sm text-slate-700 leading-relaxed">{s}</p>
                      </motion.div>
                    ))}
                  </motion.div>
                )}

              </AnimatePresence>
            </div>
          </div>

        </motion.div>
      )}
      </AnimatePresence>

      {/* Empty state */}
      {!data && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-500 to-violet-600 text-white shadow-lg mb-4">
            <Share2 className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Analyse Your Social Media Presence</h2>
          <p className="text-sm text-slate-400 max-w-md">Enter your Facebook, Instagram, LinkedIn or YouTube profile URLs above to get a comprehensive audit including profile completeness, bio availability, contact info, website links, recent activity, and a Social Score (0–100).</p>
        </motion.div>
      )}
    </div>
  );
};

export default SocialMedia;

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, AlertTriangle, XCircle, Info,
  Globe, FileText, Zap, BarChart2, TrendingUp, Shield,
  ChevronDown, ChevronUp, Clock, ExternalLink, Download, Printer,
  Hash, Cpu, MapPin, Link2, ImageIcon, BookOpen, RefreshCw, CheckCircle
} from 'lucide-react';
import { generatePDF, printReport } from '../utils/pdfGenerator';
import { auditAPI } from '../services/api';

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const scoreColor = (s) =>
  s >= 80 ? '#10b981' : s >= 55 ? '#f59e0b' : '#ef4444';

const scoreLabel = (s) =>
  s >= 80 ? 'Great' : s >= 55 ? 'Needs Work' : 'Poor';

const levelMeta = {
  critical: { icon: XCircle,        color: 'text-red-500',    bg: 'bg-red-50',    border: 'border-red-200',    label: 'Critical' },
  warning:  { icon: AlertTriangle,  color: 'text-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-200',  label: 'Warning'  },
  info:     { icon: Info,           color: 'text-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200',   label: 'Info'     },
  pass:     { icon: CheckCircle,    color: 'text-emerald-500',bg: 'bg-emerald-50',border: 'border-emerald-200',label: 'Pass'     },
};

/* ─── Score Ring ───────────────────────────────────────────────────────────── */
const ScoreRing = ({ score, size = 120, label }) => {
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = scoreColor(score);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={10} />
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeLinecap="round" strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle"
          className="rotate-90" style={{ transform: `rotate(90deg) translate(0px, -${size}px)`,
          transformOrigin: `${size/2}px ${size/2}px`, fill: color, fontSize: size * 0.22, fontWeight: 800 }}>
          {score}
        </text>
      </svg>
      {label && <p className="text-xs font-semibold text-slate-500">{label}</p>}
    </div>
  );
};

/* ─── Check row with expand ────────────────────────────────────────────────── */
const CheckRow = ({ item, i }) => {
  const [open, setOpen] = useState(false);
  const m = levelMeta[item.level] || levelMeta.info;
  const Icon = m.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 rounded-xl transition-all text-left">
        <Icon className={`h-4 w-4 shrink-0 ${m.color}`} />
        <span className="flex-1 text-sm font-medium text-slate-700 leading-snug">{item.message}</span>
        <span className={`hidden sm:inline text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${m.bg} ${m.border} ${m.color}`}>{m.label}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-300" /> : <ChevronDown className="h-4 w-4 text-slate-300" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className={`mx-3 mb-2 rounded-xl px-4 py-3 text-xs text-slate-600 border ${m.bg} ${m.border}`}>
            {item.message}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Animated progress bar ────────────────────────────────────────────────── */
const Bar = ({ label, value, max, color, suffix = '' }) => (
  <div>
    <div className="flex justify-between mb-1">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <span className="text-xs font-bold text-slate-800">{value}{suffix}</span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <motion.div className={`h-full rounded-full ${color}`}
        initial={{ width: 0 }} animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
        transition={{ duration: 1, ease: 'easeOut' }} />
    </div>
  </div>
);

/* ─── Check Card ────────────────────────────────────────────────────────────── */
const CheckCard = ({ icon: Icon, label, value, color }) => (
  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
    className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color} text-white`}>
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-bold text-slate-800">{value}</p>
    </div>
  </motion.div>
);

/* ════════════════════════════════════════════════════════════════════════════ */
const SEOAudit = () => {
  const [url, setUrl]       = useState('');
  const [loading, setLoad]  = useState(false);
  const [history, setHist]  = useState([]);
  const [data, setData]     = useState(null);
  const [tab, setTab]       = useState('errors');
  const [error, setError]   = useState('');
  const inputRef = useRef();

  useEffect(() => {
    auditAPI.getHistory().then(h => {
      setHist(h);
      if (h.length) setData(h[0]);
    }).catch(() => {});
  }, []);

  const handleRun = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoad(true); setError(''); setData(null);
    try {
      const result = await auditAPI.runAudit(url.trim());
      setData(result);
      setHist(prev => [result, ...prev.filter(x => x.id !== result.id)]);
      setTab('errors');
    } catch (err) {
      setError(err?.response?.data?.detail || 'Audit failed. Please try again.');
    } finally { setLoad(false); }
  };

  const errors   = data?.seo_errors || [];
  const suggests = data?.improvement_suggestions || [];
  const keywords = data?.keyword_density?.top_keywords || [];

  const criticals = errors.filter(e => e.level === 'critical').length;
  const warnings  = errors.filter(e => e.level === 'warning').length;

  const tabs = [
    { id: 'errors',  label: 'SEO Errors',      icon: XCircle,   count: errors.length },
    { id: 'suggest', label: 'Recommendations',  icon: TrendingUp, count: suggests.length },
    { id: 'keywords',label: 'Keyword Density',  icon: Hash,      count: keywords.length },
    { id: 'headers', label: 'Header Structure', icon: FileText,  count: null },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">SEO Audit</h1>
          <p className="text-slate-500 text-sm mt-0.5">Full on-page, technical & content analysis — Module 4</p>
        </div>
        {history.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Clock className="h-3.5 w-3.5" />
            {history.length} audit{history.length !== 1 ? 's' : ''} run
          </div>
        )}
      </div>

      {/* URL Input */}
      <form onSubmit={handleRun} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
          <Globe className="h-4 w-4 text-violet-500" /> Enter Website URL to Audit
        </label>
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input ref={inputRef} value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://yourdomain.com"
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all"
            />
          </div>
          <motion.button type="submit" disabled={loading || !url.trim()}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-60">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {loading ? 'Scanning…' : 'Run Audit'}
          </motion.button>
        </div>
        {error && <p className="mt-3 text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3.5 w-3.5" />{error}</p>}
        {loading && (
          <div className="mt-4 space-y-1.5">
            {['Fetching page content…','Checking robots.txt & sitemap…','Analysing headers & metadata…','Computing SEO score…'].map((s, i) => (
              <motion.p key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
                className="text-xs text-slate-400 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />{s}
              </motion.p>
            ))}
          </div>
        )}
      </form>

      {/* Recent history pills */}
      {history.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {history.slice(0, 5).map(h => (
            <button key={h.id} onClick={() => setData(h)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${data?.id === h.id ? 'bg-violet-100 border-violet-300 text-violet-700' : 'bg-white border-slate-200 text-slate-500 hover:border-violet-200'}`}>
              {(h.website_url || '').replace(/^https?:\/\//, '').split('/')[0]}
            </button>
          ))}
        </div>
      )}

      {/* ── Results ── */}
      <AnimatePresence>
      {data && (
        <motion.div key={data.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-5">

          <div className="flex justify-end gap-2 mb-2">
            <button onClick={() => generatePDF(data, 'SEO Audit')} className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-3 py-1.5 hover:opacity-90 transition-all shadow-sm">
              <Download className="h-3 w-3" /> Download PDF
            </button>
            <button onClick={() => printReport(data, 'SEO Audit')} className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all hidden sm:flex">
              <Printer className="h-3 w-3" /> Print
            </button>
          </div>

          {/* Score strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'SEO Score',    val: data.seo_score,    icon: TrendingUp, grad: 'from-violet-500 to-purple-600' },
              { label: 'Health Score', val: data.health_score, icon: Shield,     grad: 'from-emerald-500 to-teal-500' },
              { label: 'Errors',       val: criticals,         icon: XCircle,    grad: 'from-red-500 to-rose-600' },
              { label: 'Warnings',     val: warnings,          icon: AlertTriangle,grad:'from-amber-500 to-orange-500'},
            ].map((k, i) => (
              <motion.div key={k.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
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

          {/* Main grid: ring + checks */}
          <div className="grid lg:grid-cols-3 gap-5">
            {/* Score + meta summary */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col items-center gap-4">
              <ScoreRing score={data.seo_score} size={140} />
              <div className="text-center">
                <p className="text-lg font-extrabold text-slate-800">{scoreLabel(data.seo_score)}</p>
                <a href={data.website_url} target="_blank" rel="noopener noreferrer"
                  className="text-xs text-violet-500 hover:underline flex items-center gap-1 justify-center mt-1">
                  {(data.website_url || '').replace(/^https?:\/\//, '').split('/')[0]}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="w-full space-y-3 pt-2 border-t border-slate-100">
                <Bar label="Readability" value={data.readability_score || 0} max={100} color="bg-gradient-to-r from-cyan-400 to-blue-500" suffix="/100" />
                <Bar label="Content Words" value={Math.min(data.word_count || 0, 2000)} max={2000} color="bg-gradient-to-r from-violet-400 to-purple-500" suffix={` (${data.word_count || 0})`} />
                <Bar label="Internal Links" value={Math.min((data.internal_links || []).length, 30)} max={30} color="bg-gradient-to-r from-emerald-400 to-teal-500" suffix={` (${(data.internal_links || []).length})`} />
              </div>
            </div>

            {/* Technical checks grid */}
            <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3 content-start">
              {[
                { icon: Shield,    label: 'HTTPS',        value: data.is_https ? '✓ Secure' : '✗ Not Secure',   color: data.is_https ? 'bg-emerald-500' : 'bg-red-500' },
                { icon: Cpu,       label: 'Robots.txt',   value: data.has_robots_txt ? '✓ Found' : '✗ Missing',  color: data.has_robots_txt ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: MapPin,    label: 'Sitemap',      value: data.has_sitemap ? '✓ Found' : '✗ Missing',     color: data.has_sitemap ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: Link2,     label: 'Canonical',    value: data.has_canonical ? '✓ Set' : '✗ Missing',    color: data.has_canonical ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: FileText,  label: 'Title Length', value: `${(data.title || '').length} chars`,           color: (data.title||'').length >= 30 && (data.title||'').length <= 60 ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: FileText,  label: 'Meta Length',  value: `${(data.meta_description || '').length} chars`,color: (data.meta_description||'').length >= 120 ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: Hash,      label: 'H1 Tags',      value: `${(data.h1_tags || []).length} found`,         color: (data.h1_tags||[]).length === 1 ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: Hash,      label: 'H2 Tags',      value: `${(data.h2_tags || []).length} found`,         color: (data.h2_tags||[]).length > 0 ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: ImageIcon, label: 'Images',       value: `${data.images_count || 0} total / ${(data.image_alt_tags || {}).missing_alt || 0} no-alt`, color: ((data.image_alt_tags||{}).missing_alt || 0) === 0 ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: BookOpen,  label: 'Readability',  value: data.readability_grade || '—',                  color: ['Easy','Very Easy'].includes(data.readability_grade) ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: Zap,       label: 'Scripts',      value: `${data.scripts_count || 0}`,                   color: (data.scripts_count || 0) <= 20 ? 'bg-emerald-500' : 'bg-amber-500' },
                { icon: Zap,       label: 'Stylesheets',  value: `${data.stylesheets_count || 0}`,               color: (data.stylesheets_count || 0) <= 10 ? 'bg-emerald-500' : 'bg-amber-500' },
              ].map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
                  <CheckCard {...c} />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Tabs: errors / recommendations / keywords / headers */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100 px-4 pt-4 gap-1 overflow-x-auto">
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 whitespace-nowrap transition-all ${tab === t.id ? 'border-violet-500 text-violet-600 bg-violet-50/60' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
                  <t.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{t.label}</span>
                  {t.count !== null && <span className="text-[10px] bg-slate-100 text-slate-500 rounded-full px-1.5 py-0.5 font-bold">{t.count}</span>}
                </button>
              ))}
            </div>

            <div className="p-5">
              <AnimatePresence mode="wait">
                {tab === 'errors' && (
                  <motion.div key="errors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="divide-y divide-slate-50">
                    {errors.length === 0
                      ? <p className="text-sm text-emerald-600 flex items-center gap-2 py-4"><CheckCircle className="h-4 w-4" />No SEO errors detected — great job!</p>
                      : errors.map((e, i) => <CheckRow key={i} item={e} i={i} />)}
                  </motion.div>
                )}
                {tab === 'suggest' && (
                  <motion.div key="suggest" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    {suggests.map((s, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="rounded-xl bg-violet-50 border border-violet-100 p-3.5 text-sm text-slate-700 leading-relaxed">
                        {s}
                      </motion.div>
                    ))}
                  </motion.div>
                )}
                {tab === 'keywords' && (
                  <motion.div key="keywords" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                    <p className="text-xs text-slate-400 mb-4">Top keywords by frequency found in page content (stopwords excluded)</p>
                    {keywords.map((kw, i) => (
                      <div key={kw.keyword}>
                        <div className="flex justify-between mb-1 items-center">
                          <span className="text-xs font-semibold text-slate-700">{kw.keyword}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-400">{kw.count}×</span>
                            <span className="text-xs font-bold text-violet-600">{kw.density}%</span>
                          </div>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
                            initial={{ width: 0 }} animate={{ width: `${Math.min(100, kw.density * 20)}%` }}
                            transition={{ duration: 0.8, delay: i * 0.06, ease: 'easeOut' }} />
                        </div>
                      </div>
                    ))}
                  </motion.div>
                )}
                {tab === 'headers' && (
                  <motion.div key="headers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                    {[
                      { tag: 'H1', items: data.h1_tags || [], color: 'from-violet-500 to-purple-600', ideal: 'Exactly 1' },
                      { tag: 'H2', items: data.h2_tags || [], color: 'from-cyan-500 to-blue-500', ideal: '3–8' },
                      { tag: 'H3', items: data.h3_tags || [], color: 'from-emerald-500 to-teal-500', ideal: 'Optional' },
                    ].map(({ tag, items, color, ideal }) => (
                      <div key={tag} className="rounded-xl border border-slate-100 p-4">
                        <div className="flex items-center gap-3 mb-3">
                          <span className={`text-xs font-extrabold px-2 py-0.5 rounded-md text-white bg-gradient-to-r ${color}`}>{tag}</span>
                          <span className="text-xs text-slate-400">Found: <strong className="text-slate-700">{items.length}</strong> — Ideal: {ideal}</span>
                        </div>
                        {items.length === 0
                          ? <p className="text-xs text-slate-400 italic">None found</p>
                          : <ul className="space-y-1">
                              {items.slice(0, 8).map((h, i) => (
                                <li key={i} className="text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2 truncate">{h}</li>
                              ))}
                            </ul>}
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Title & meta preview */}
          {(data.title || data.meta_description) && (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
              <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                <Search className="h-4 w-4 text-violet-500" /> Google SERP Preview
              </h3>
              <div className="rounded-xl border border-slate-200 p-4 bg-slate-50/50 max-w-xl">
                <p className="text-xs text-emerald-700 mb-1">{(data.website_url || '').replace(/^https?:\/\//, '')}</p>
                <p className="text-blue-700 font-medium text-sm hover:underline cursor-pointer leading-snug mb-1">
                  {data.title || '(No title)'}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {data.meta_description ? data.meta_description.slice(0, 160) : '(No meta description)'}
                </p>
              </div>
            </div>
          )}

        </motion.div>
      )}
      </AnimatePresence>

      {/* Empty state */}
      {!data && !loading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg mb-4">
            <BarChart2 className="h-8 w-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Run Your First SEO Audit</h2>
          <p className="text-sm text-slate-400 max-w-md">Enter any website URL above to get a comprehensive SEO analysis including meta tags, header structure, readability score, keyword density, robots.txt, sitemap, canonical tags and an overall SEO score (0–100).</p>
        </motion.div>
      )}
    </div>
  );
};

export default SEOAudit;

import { useState, useEffect } from 'react';
import { auditAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, Zap, AlertTriangle, Info,
  Loader, Shield, Smartphone, Clock, TrendingUp,
  BarChart2, RefreshCw, ExternalLink, Download, Printer
} from 'lucide-react';
import { generatePDF, printReport } from '../utils/pdfGenerator';

const ScoreRing = ({ score, size = 80, color = '#8B5CF6' }) => {
  const r = 34, c = 2 * Math.PI * r;
  const offset = c - (score / 100) * c;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 80 80" className="-rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#f1f5f9" strokeWidth="7" />
        <motion.circle cx="40" cy="40" r={r} fill="none" stroke={color} strokeWidth="7"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }} animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-extrabold text-slate-800">{score}</span>
        <span className="text-[9px] text-slate-400 font-medium">/100</span>
      </div>
    </div>
  );
};

const ScanAnimation = ({ url }) => (
  <div className="flex flex-col items-center py-16 px-6">
    <div className="relative mb-8">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25">
        <Globe className="h-10 w-10 text-white" />
      </div>
      <motion.div className="absolute inset-0 rounded-2xl border-2 border-cyan-400 opacity-60"
        animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }} transition={{ duration: 2, repeat: Infinity }} />
      <motion.div className="absolute inset-0 rounded-2xl border-2 border-blue-400 opacity-40"
        animate={{ scale: [1, 1.7, 1], opacity: [0.4, 0, 0.4] }} transition={{ duration: 2, repeat: Infinity, delay: 0.4 }} />
    </div>
    <motion.h3 className="text-lg font-bold text-slate-800 mb-2"
      animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity }}>
      Scanning Website...
    </motion.h3>
    <p className="text-slate-400 text-sm mb-6 text-center max-w-xs">{url}</p>
    <div className="w-64 space-y-2">
      {['Checking SSL & Security', 'Analyzing SEO Metadata', 'Testing Page Speed', 'Reviewing Social Tags', 'Generating AI Report'].map((step, i) => (
        <motion.div key={step} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }}
          className="flex items-center gap-2 text-xs text-slate-500">
          <Loader className="h-3 w-3 animate-spin text-violet-500" />
          {step}
        </motion.div>
      ))}
    </div>
  </div>
);

const AuditMetricBadge = ({ label, value, icon: Icon, ok }) => (
  <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm ${ok ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-600'}`}>
    <Icon className="h-4 w-4 shrink-0" />
    <span className="font-medium">{label}:</span>
    <span className="font-bold">{value}</span>
  </div>
);

const typeStyles = {
  critical: { bg: 'bg-red-50', border: 'border-red-100', icon: AlertTriangle, iconColor: 'text-red-500', label: 'Critical' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle, iconColor: 'text-amber-500', label: 'Warning' },
  info: { bg: 'bg-blue-50', border: 'border-blue-100', icon: Info, iconColor: 'text-blue-500', label: 'Info' },
};

const WebsiteAudit = () => {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [audits, setAudits] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    auditAPI.getHistory().then(data => { setAudits(data); if (data.length > 0) setSelected(data[0]); }).finally(() => setLoading(false));
  }, []);

  const handleScan = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setError('');
    setScanning(true);
    try {
      let scanUrl = url.trim();
      if (!scanUrl.startsWith('http')) scanUrl = 'https://' + scanUrl;
      const result = await auditAPI.runAudit(scanUrl);
      setAudits(prev => [result, ...prev]);
      setSelected(result);
      setUrl('');
    } catch {
      setError('Scan failed. Please check the URL and try again.');
    } finally {
      setScanning(false);
    }
  };

  const scoreColor = (s) => s >= 80 ? '#10B981' : s >= 55 ? '#F59E0B' : '#F43F5E';
  const scoreLabel = (s) => s >= 80 ? 'Excellent' : s >= 55 ? 'Needs Work' : 'Critical';

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Website Audit</h1>
          <p className="text-slate-500 text-sm mt-0.5">Run comprehensive health & SEO scans on any website</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-white rounded-xl border border-slate-100 px-3 py-2 shadow-sm">
          <BarChart2 className="h-4 w-4 text-violet-500" />
          <span>{audits.length} total audits performed</span>
        </div>
      </div>

      {/* Scan Form */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-800 mb-1">Scan a Website</h2>
        <p className="text-xs text-slate-400 mb-4">Enter any URL to get an instant AI-powered health report</p>
        <form onSubmit={handleScan} className="flex gap-3 flex-col sm:flex-row">
          <div className="relative flex-1">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text" value={url} onChange={e => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all"
              disabled={scanning}
            />
          </div>
          <motion.button type="submit" disabled={scanning || !url.trim()} whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 disabled:opacity-50 transition-all shrink-0">
            {scanning ? <Loader className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {scanning ? 'Scanning...' : 'Run Audit'}
          </motion.button>
        </form>
        {error && <p className="mt-3 text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />{error}</p>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Audit History List */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-800">Audit History</h3>
            <p className="text-xs text-slate-400 mt-0.5">{audits.length} reports generated</p>
          </div>
          <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
            {loading ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-3 px-5 py-4">
                  <div className="h-10 w-10 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="flex-1 space-y-2"><div className="h-3 w-32 bg-slate-100 rounded animate-pulse" /><div className="h-2 w-20 bg-slate-100 rounded animate-pulse" /></div>
                </div>
              ))
            ) : audits.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400 px-5">No audits yet. Enter a URL above to get started.</div>
            ) : (
              audits.map(audit => (
                <button key={audit.id} onClick={() => setSelected(audit)}
                  className={`w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-slate-50 transition-all ${selected?.id === audit.id ? 'bg-violet-50 border-l-2 border-violet-500' : ''}`}>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-cyan-50">
                    <Globe className="h-4 w-4 text-cyan-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">{audit.title || audit.website_url}</p>
                    <p className="text-xs text-slate-400 truncate">{new Date(audit.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${audit.health_score >= 80 ? 'bg-emerald-50 text-emerald-600' : audit.health_score >= 55 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'}`}>
                    {audit.health_score}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Audit Detail */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm">
                <ScanAnimation url={url} />
              </motion.div>
            ) : selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
                className="space-y-5">

                {/* Score Cards */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h3 className="text-base font-bold text-slate-800">{selected.title || selected.website_url}</h3>
                      <a href={selected.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-violet-500 hover:underline mt-0.5">
                        {selected.website_url} <ExternalLink className="h-3 w-3" />
                      </a>
                      <p className="text-xs text-slate-400 mt-1">{new Date(selected.created_at).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setUrl(selected.website_url)} className="flex items-center gap-1.5 text-xs text-violet-600 border border-violet-200 rounded-xl px-3 py-1.5 hover:bg-violet-50 transition-all">
                        <RefreshCw className="h-3 w-3" /> Re-scan
                      </button>
                      <button onClick={() => generatePDF(selected, 'Website Audit')} className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-3 py-1.5 hover:opacity-90 transition-all shadow-sm">
                        <Download className="h-3 w-3" /> Download PDF
                      </button>
                      <button onClick={() => printReport(selected, 'Website Audit')} className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all hidden sm:flex">
                        <Printer className="h-3 w-3" /> Print
                      </button>
                    </div>
                  </div>

                  {/* Score Ring Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-items-center mb-5">
                    {[
                      { label: 'Health', score: selected.health_score },
                      { label: 'SEO', score: selected.seo_score },
                      { label: 'Performance', score: selected.performance_score },
                      { label: 'Marketing', score: selected.marketing_score },
                    ].map(item => (
                      <div key={item.label} className="flex flex-col items-center gap-2">
                        <ScoreRing score={item.score} color={scoreColor(item.score)} />
                        <div className="text-center">
                          <p className="text-xs font-bold text-slate-700">{item.label}</p>
                          <p className={`text-[10px] font-medium ${item.score >= 80 ? 'text-emerald-500' : item.score >= 55 ? 'text-amber-500' : 'text-red-500'}`}>
                            {scoreLabel(item.score)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Metric Badges */}
                  <div className="flex flex-wrap gap-2">
                    <AuditMetricBadge label="SSL" value={selected.secure ? 'Secure' : 'Insecure'} icon={Shield} ok={selected.secure} />
                    <AuditMetricBadge label="Mobile" value={selected.mobile_friendly ? 'Friendly' : 'Issues Found'} icon={Smartphone} ok={selected.mobile_friendly} />
                    <AuditMetricBadge label="Load Time" value={selected.load_time} icon={Clock} ok={parseFloat(selected.load_time) < 2.5} />
                    <AuditMetricBadge label="Open Graph" value={selected.open_graph ? 'Present' : 'Missing'} icon={TrendingUp} ok={selected.open_graph} />
                  </div>
                </div>

                {/* Performance Bar */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Score Breakdown</h4>
                  <div className="space-y-3">
                    {[
                      { label: 'Website Health', score: selected.health_score, color: 'from-cyan-400 to-blue-500' },
                      { label: 'SEO Score', score: selected.seo_score, color: 'from-emerald-400 to-teal-500' },
                      { label: 'Performance', score: selected.performance_score, color: 'from-violet-400 to-purple-500' },
                      { label: 'Social Media', score: selected.social_score, color: 'from-pink-400 to-rose-500' },
                      { label: 'Marketing', score: selected.marketing_score, color: 'from-amber-400 to-orange-500' },
                    ].map(item => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-32 shrink-0">{item.label}</span>
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                            initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700 w-8 text-right">{item.score}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-violet-500" /> AI Recommendations
                  </h4>
                  <div className="space-y-3">
                    {(selected.suggestions || []).map((s, i) => {
                      const style = typeStyles[s.type] || typeStyles.info;
                      const Icon = style.icon;
                      return (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          className={`flex gap-3 rounded-xl border p-3.5 ${style.bg} ${style.border}`}>
                          <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.iconColor}`} />
                          <div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${style.iconColor}`}>{style.label}</span>
                            <p className="text-xs text-slate-700 mt-0.5 leading-relaxed">{s.message}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
                <Globe className="h-12 w-12 text-slate-200 mb-4" />
                <h3 className="text-base font-bold text-slate-600">No Audit Selected</h3>
                <p className="text-sm text-slate-400 mt-1 max-w-xs">Enter a URL above to run your first website audit, or select from your audit history.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default WebsiteAudit;

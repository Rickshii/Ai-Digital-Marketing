import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, CheckCircle, AlertTriangle, TrendingUp, BarChart2, Globe, FileText, Link2, Zap, ChevronDown, ChevronUp } from 'lucide-react';

const mockSeoData = {
  onPage: [
    { check: 'Title Tag Present', status: 'pass', detail: 'Found: "Acme SaaS - Cloud Optimization Platform" (52 chars)' },
    { check: 'Meta Description', status: 'pass', detail: 'Present and within 155 character limit.' },
    { check: 'H1 Tag', status: 'pass', detail: 'Single H1 found on homepage.' },
    { check: 'H2–H6 Hierarchy', status: 'warning', detail: 'H3 used before H2 on /features page. Fix heading hierarchy.' },
    { check: 'Image Alt Tags', status: 'fail', detail: '14 images missing alt attributes across catalog pages.' },
    { check: 'Canonical Tags', status: 'pass', detail: 'Canonical URLs set correctly on all indexed pages.' },
    { check: 'Schema Markup', status: 'warning', detail: 'No structured data found. Add Organization or Product schema.' },
    { check: 'Open Graph Tags', status: 'pass', detail: 'OG title, description and image found.' },
  ],
  technical: [
    { check: 'XML Sitemap', status: 'pass', detail: 'Sitemap found at /sitemap.xml with 48 URLs indexed.' },
    { check: 'Robots.txt', status: 'pass', detail: 'robots.txt present and correctly configured.' },
    { check: 'SSL Certificate', status: 'pass', detail: 'Valid HTTPS. Certificate expires in 342 days.' },
    { check: 'Mobile Friendly', status: 'pass', detail: 'Passes Google Mobile-Friendly Test.' },
    { check: 'Page Speed (Mobile)', status: 'warning', detail: 'Score: 62/100. LCP is 3.4s. Optimize images and defer JS.' },
    { check: 'Core Web Vitals', status: 'warning', detail: 'FID: Pass | LCP: Needs Improvement | CLS: Pass' },
    { check: 'Broken Links', status: 'fail', detail: '3 broken internal links found on /blog page.' },
    { check: 'HTTPS Redirects', status: 'pass', detail: 'All HTTP URLs redirect to HTTPS correctly.' },
  ],
  keywords: [
    { keyword: 'cloud cost optimization', volume: '8,100/mo', difficulty: 45, position: 12 },
    { keyword: 'saas auto scaling', volume: '5,400/mo', difficulty: 52, position: 8 },
    { keyword: 'server cost reduction software', volume: '2,900/mo', difficulty: 38, position: 3 },
    { keyword: 'cloud infrastructure management', volume: '14,800/mo', difficulty: 68, position: 24 },
    { keyword: 'devops cost tools', volume: '1,600/mo', difficulty: 29, position: 6 },
  ],
};

const statusStyles = {
  pass: { icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-100', label: 'Pass' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-100', label: 'Warning' },
  fail: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-100', label: 'Fail' },
};

const CheckRow = ({ item, index }) => {
  const [open, setOpen] = useState(false);
  const s = statusStyles[item.status];
  const Icon = s.icon;
  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center gap-3 p-3.5 hover:bg-slate-50 rounded-xl transition-all text-left">
        <Icon className={`h-4 w-4 shrink-0 ${s.color}`} />
        <span className="flex-1 text-sm font-medium text-slate-700">{item.check}</span>
        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${s.bg} ${s.border} ${s.color}`}>{s.label}</span>
        {open ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className={`mx-3 mb-2 rounded-xl px-4 py-3 text-xs text-slate-600 leading-relaxed border ${s.bg} ${s.border}`}>
            {item.detail}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const difficultyColor = (d) => d >= 60 ? 'text-red-500 bg-red-50' : d >= 40 ? 'text-amber-500 bg-amber-50' : 'text-emerald-600 bg-emerald-50';
const positionColor = (p) => p <= 3 ? 'text-emerald-600 bg-emerald-50' : p <= 10 ? 'text-blue-600 bg-blue-50' : 'text-slate-500 bg-slate-100';

const SEOAudit = () => {
  const [tab, setTab] = useState('onpage');
  const passCount = (arr) => arr.filter(i => i.status === 'pass').length;
  const tabs = [
    { id: 'onpage', label: 'On-Page SEO', icon: FileText },
    { id: 'technical', label: 'Technical SEO', icon: Zap },
    { id: 'keywords', label: 'Keyword Rankings', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">SEO Audit</h1>
        <p className="text-slate-500 text-sm mt-0.5">Comprehensive on-page, technical & keyword analysis</p>
      </div>

      {/* Summary KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'On-Page Score', value: `${passCount(mockSeoData.onPage)}/${mockSeoData.onPage.length}`, icon: FileText, color: 'from-violet-500 to-purple-600' },
          { label: 'Technical Score', value: `${passCount(mockSeoData.technical)}/${mockSeoData.technical.length}`, icon: Zap, color: 'from-cyan-500 to-blue-500' },
          { label: 'Keywords Tracked', value: mockSeoData.keywords.length, icon: Search, color: 'from-emerald-500 to-teal-600' },
          { label: 'Top 10 Rankings', value: mockSeoData.keywords.filter(k => k.position <= 10).length, icon: TrendingUp, color: 'from-amber-500 to-orange-500' },
        ].map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${kpi.color} text-white shadow-sm`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{kpi.value}</p>
              <p className="text-xs text-slate-400 leading-tight">{kpi.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-4 pt-4 gap-1">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all ${tab === t.id ? 'border-violet-500 text-violet-600 bg-violet-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <t.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-4">
          <AnimatePresence mode="wait">
            {(tab === 'onpage' || tab === 'technical') && (
              <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="divide-y divide-slate-50">
                {(tab === 'onpage' ? mockSeoData.onPage : mockSeoData.technical).map((item, i) => (
                  <CheckRow key={item.check} item={item} index={i} />
                ))}
              </motion.div>
            )}
            {tab === 'keywords' && (
              <motion.div key="keywords" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide pb-3">Keyword</th>
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide pb-3">Volume</th>
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide pb-3">Difficulty</th>
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide pb-3">Position</th>
                      <th className="text-left text-xs font-bold text-slate-400 uppercase tracking-wide pb-3">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {mockSeoData.keywords.map((kw, i) => (
                      <motion.tr key={kw.keyword} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="hover:bg-slate-50 transition-all">
                        <td className="py-3 pr-4">
                          <span className="font-medium text-slate-800">{kw.keyword}</span>
                        </td>
                        <td className="py-3 pr-4 text-slate-500">{kw.volume}</td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${difficultyColor(kw.difficulty)}`}>{kw.difficulty}</span>
                        </td>
                        <td className="py-3 pr-4">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${positionColor(kw.position)}`}>#{kw.position}</span>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-1 text-xs text-emerald-600">
                            <TrendingUp className="h-3 w-3" /> +2
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SEO Score Progress Bars */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-5 flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-violet-500" /> SEO Category Scores
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { label: 'Content Quality', score: 82, color: 'from-violet-400 to-purple-500' },
            { label: 'Link Profile', score: 64, color: 'from-cyan-400 to-blue-500' },
            { label: 'Technical Health', score: 75, color: 'from-emerald-400 to-teal-500' },
            { label: 'Local SEO', score: 48, color: 'from-amber-400 to-orange-500' },
          ].map((item, i) => (
            <div key={item.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-600">{item.label}</span>
                <span className="text-xs font-bold text-slate-800">{item.score}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className={`h-full rounded-full bg-gradient-to-r ${item.color}`}
                  initial={{ width: 0 }} animate={{ width: `${item.score}%` }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SEOAudit;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Megaphone, Calendar, Target, TrendingUp, Zap, CheckCircle,
  Clock, Flag, BarChart2, Users, Mail, Globe, Sparkles, BookOpen, Key, Download, Printer
} from 'lucide-react';
import { generatePDF, printReport } from '../utils/pdfGenerator';
import { strategyAPI } from '../services/api';

const statusConfig = {
  done: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Complete' },
  active: { color: 'text-violet-600 bg-violet-50 border-violet-200', dot: 'bg-violet-500 animate-pulse', label: 'In Progress' },
  pending: { color: 'text-slate-500 bg-slate-50 border-slate-200', dot: 'bg-slate-300', label: 'Upcoming' },
};

const channelIconMap = {
  'seo & content': Globe,
  'paid social ads': Users,
  'email marketing': Mail,
  'google ads': Target,
  'influencer outreach': Megaphone,
  'influencer': Megaphone
};

const channelColorMap = {
  'seo & content': 'from-emerald-400 to-teal-500',
  'paid social ads': 'from-pink-400 to-rose-500',
  'email marketing': 'from-blue-400 to-indigo-500',
  'google ads': 'from-amber-400 to-orange-500',
  'influencer outreach': 'from-violet-400 to-purple-500',
  'influencer': 'from-violet-400 to-purple-500'
};

const MarketingStrategy = () => {
  const [strategy, setStrategy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [tab, setTab] = useState('plan30');

  const fetchLatestStrategy = async () => {
    try {
      setLoading(true);
      const data = await strategyAPI.getLatest();
      setStrategy(data);
    } catch (err) {
      console.error('Error fetching marketing strategy:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLatestStrategy();
  }, []);

  const handleGenerate = async () => {
    try {
      setRegenerating(true);
      const data = await strategyAPI.generate();
      setStrategy(data);
    } catch (err) {
      console.error('Error generating strategy:', err);
    } finally {
      setRegenerating(false);
    }
  };

  const tabs = [
    { id: 'plan30', label: '30-Day Plan', icon: Calendar },
    { id: 'plan90', label: '90-Day Roadmap', icon: TrendingUp },
    { id: 'channels', label: 'Channel & Content', icon: BarChart2 },
    { id: 'branding', label: 'Branding & Lead Gen', icon: Sparkles },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-12 w-12 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold animate-pulse">Assembling custom marketing strategy...</p>
      </div>
    );
  }

  const scoresUsed = strategy?.scores_used || {
    business_score: 50,
    website_health_score: 50,
    seo_score: 50,
    social_media_score: 50
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Marketing Strategy</h1>
          <p className="text-slate-500 text-sm mt-0.5">Rule-based growth roadmap tailored to your business scores</p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <button onClick={() => generatePDF(strategy, 'Marketing Strategy')} className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-4 py-2 hover:opacity-90 transition-all shadow-sm">
            <Download className="h-4 w-4" /> Download PDF
          </button>
          <button onClick={() => printReport(strategy, 'Marketing Strategy')} className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 transition-all hidden sm:flex">
            <Printer className="h-4 w-4" /> Print
          </button>
          <motion.button
            onClick={handleGenerate}
            disabled={regenerating}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-500/20 hover:opacity-95 disabled:opacity-60 transition-all"
          >
            {regenerating ? (
              <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
            ) : (
              <><Zap className="h-4 w-4" /> Recalculate</>
            )}
          </motion.button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Strategy Score', value: `${strategy?.strategy_score || 0}/100`, icon: TrendingUp, color: 'from-violet-500 to-purple-600' },
          { label: 'Active Tasks Completed', value: strategy?.active_tasks || '0/16', icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
          { label: 'Est. Monthly Reach', value: strategy?.reach_estimate || '25K+', icon: Users, color: 'from-cyan-500 to-blue-500' },
          { label: 'Projected ROI', value: strategy?.projected_roi || '300%', icon: BarChart2, color: 'from-amber-500 to-orange-500' },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-sm`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{c.value}</p>
              <p className="text-xs text-slate-400 leading-tight">{c.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Input Score Indicators */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Analysis Inputs Analyzed</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Business Profile', score: scoresUsed.business_score },
            { label: 'Website Health', score: scoresUsed.website_health_score },
            { label: 'SEO Audit', score: scoresUsed.seo_score },
            { label: 'Social Media', score: scoresUsed.social_media_score },
          ].map((item, idx) => {
            const percentageColor = item.score >= 80 ? 'text-emerald-500' : item.score >= 55 ? 'text-amber-500' : 'text-red-500';
            const barColor = item.score >= 80 ? 'bg-emerald-500' : item.score >= 55 ? 'bg-amber-500' : 'bg-red-500';
            return (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <span className="text-xs font-semibold text-slate-500 block mb-1">{item.label}</span>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className={`text-base font-bold ${percentageColor}`}>{item.score}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor}`} style={{ width: `${item.score}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-100 px-4 pt-4 gap-1 overflow-x-auto scrollbar-none">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-xl border-b-2 transition-all shrink-0 ${tab === t.id ? 'border-violet-500 text-violet-600 bg-violet-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
              <t.icon className="h-4 w-4" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {tab === 'plan30' && (
              <motion.div key="plan30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {(strategy?.plan_30_day || []).map((week, i) => {
                  const s = statusConfig[week.status || 'pending'];
                  return (
                    <motion.div key={week.week} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                      className={`rounded-2xl border p-5 ${s.color}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full shrink-0 mt-1 ${s.dot}`} />
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest opacity-70">{week.week}</p>
                            <h3 className="text-base font-bold text-slate-800">{week.title}</h3>
                          </div>
                        </div>
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${s.color}`}>{s.label}</span>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 pl-5">
                        {week.tasks.map((task, j) => (
                          <div key={j} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                            <CheckCircle className="h-4 w-4 shrink-0 text-violet-500 mt-0.5" />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}

            {tab === 'plan90' && (
              <motion.div key="plan90" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <div className="relative pl-8">
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-300 to-transparent" />
                  {(strategy?.plan_90_day || []).map((phase, i) => {
                    const months = ["Month 2", "Month 3", "Ongoing"];
                    const colors = ["from-emerald-500 to-teal-600", "from-violet-500 to-purple-600", "from-amber-500 to-orange-500"];
                    const icons = [TrendingUp, Target, Flag];

                    const color = colors[i % colors.length];
                    const Icon = icons[i % icons.length];
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                        className="relative mb-6 last:mb-0">
                        <div className={`absolute -left-5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${color} text-white shadow-sm`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 hover:border-violet-100 transition-all">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{phase.month || months[i]}</span>
                          </div>
                          <h3 className="text-base font-bold text-slate-800 mb-2">{phase.title}</h3>
                          <p className="text-sm text-slate-600 leading-relaxed">{phase.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4 text-violet-500" /> 90-Day Growth Targets
                  </h4>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {[
                      { metric: 'Organic Traffic Target', target: `+${(strategy?.strategy_score || 50) + 50}%`, current: 'Baseline', projected: 'Target Met' },
                      { metric: 'List Subscribers Target', target: `+${(strategy?.strategy_score || 50) * 2}%`, current: 'Baseline', projected: 'Target Met' },
                      { metric: 'Leads/Sales Growth', target: `+${(strategy?.strategy_score || 50) * 1.5}%`, current: 'Baseline', projected: 'Target Met' },
                    ].map((t, i) => (
                      <div key={i} className="rounded-xl bg-white border border-violet-100 p-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t.metric}</p>
                        <p className="text-2xl font-extrabold text-violet-600">{t.target}</p>
                        <p className="text-xs text-slate-400 mt-1">{t.current} → <span className="font-semibold text-slate-600">{t.projected}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'channels' && (
              <motion.div key="channels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <p className="text-sm text-slate-500">Recommended digital marketing budget and focus mix based on industry scores.</p>
                <div className="space-y-4">
                  {(strategy?.social_media_strategy?.channel_mix || []).map((ch, i) => {
                    const normalizedKey = ch.name.toLowerCase();
                    const Icon = channelIconMap[normalizedKey] || Globe;
                    const color = channelColorMap[normalizedKey] || 'from-slate-400 to-slate-500';
                    return (
                      <motion.div key={ch.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${color} text-white shadow-sm`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-1.5">
                            <div>
                              <span className="text-sm font-semibold text-slate-700 block">{ch.name}</span>
                              <span className="text-[10px] text-slate-400">{ch.channel_focus || 'Core campaign focus'}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">{ch.budget}%</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <motion.div className={`h-full rounded-full bg-gradient-to-r ${color}`}
                              initial={{ width: 0 }} animate={{ width: `${ch.budget}%` }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Content Calendar */}
                {strategy?.content_strategy && (
                  <div className="mt-6 rounded-2xl border border-slate-100 p-5">
                    <h4 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-violet-500" /> Dynamic Content Calendar Snapshot
                    </h4>
                    <p className="text-xs text-slate-400 mb-4">Pillars: {(strategy?.content_strategy?.content_pillars || []).join(', ')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {(strategy?.content_strategy?.calendar_snapshot || []).map((item, i) => (
                        <div key={i} className="rounded-xl border border-slate-100 p-4 bg-slate-50">
                          <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest block mb-1">{item.day}</span>
                          <span className="text-xs font-bold text-slate-700 block mb-0.5">{item.format}</span>
                          <span className="text-xs text-slate-500 leading-normal block">{item.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'branding' && (
              <motion.div key="branding" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-5">
                  {/* Branding */}
                  <div className="rounded-2xl border border-slate-100 p-5 space-y-4 bg-white shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <BookOpen className="h-5 w-5 text-violet-500" />
                      <h4 className="text-sm font-bold text-slate-800">Branding Strategy</h4>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Brand Voice</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl font-medium">
                        "{strategy?.branding_strategy?.brand_voice || 'Helpful, professional, and clear.'}"
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Brand Positioning Statement</span>
                      <p className="text-xs text-slate-700 leading-relaxed font-normal">
                        {strategy?.branding_strategy?.positioning_statement}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Visual Identity Suggestions</span>
                      <ul className="space-y-2">
                        {(strategy?.branding_strategy?.visual_identity_tips || []).map((tip, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-slate-600">
                            <span className="text-violet-500 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Lead Generation */}
                  <div className="rounded-2xl border border-slate-100 p-5 space-y-4 bg-white shadow-sm">
                    <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                      <Key className="h-5 w-5 text-violet-500" />
                      <h4 className="text-sm font-bold text-slate-800">Lead Generation Strategy</h4>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Recommended Lead Magnet Asset</span>
                      <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 border border-slate-100 p-3 rounded-xl font-bold">
                        {strategy?.lead_gen_strategy?.recommended_lead_magnet || 'Free Checklist / Industry Resource'}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Core Conversion Funnel Steps</span>
                      <div className="space-y-2.5">
                        {(strategy?.lead_gen_strategy?.conversion_funnel || []).map((step, idx) => (
                          <div key={idx} className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl text-xs text-slate-700">
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">High-Conversion Landing Page Tips</span>
                      <ul className="space-y-1.5">
                        {(strategy?.lead_gen_strategy?.landing_page_tips || []).map((tip, idx) => (
                          <li key={idx} className="flex gap-2 text-xs text-slate-600">
                            <span className="text-violet-500 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default MarketingStrategy;

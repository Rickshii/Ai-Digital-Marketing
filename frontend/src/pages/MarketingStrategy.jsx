import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, Calendar, Target, TrendingUp, Zap, CheckCircle, Clock, Flag, BarChart2, Users, Mail, Globe } from 'lucide-react';

const plan30 = [
  { week: 'Week 1', title: 'Foundation & Brand Audit', tasks: ['Complete brand voice guidelines doc', 'Audit all existing content for consistency', 'Set up Google Analytics 4 + Search Console', 'Publish 2 cornerstone blog articles'], status: 'done' },
  { week: 'Week 2', title: 'SEO & Content Launch', tasks: ['Publish 4 SEO-optimized articles', 'Build 10 internal links across site', 'Launch email welcome sequence (5 emails)', 'Submit sitemap to search engines'], status: 'active' },
  { week: 'Week 3', title: 'Social Media Activation', tasks: ['Set up all 4 social profiles with branding', 'Launch 3x/week posting schedule', 'Run first Instagram Story poll campaign', 'Engage with 20 target accounts daily'], status: 'pending' },
  { week: 'Week 4', title: 'Lead Generation & Review', tasks: ['Launch lead magnet (free template/guide)', 'Setup Google Ads retargeting campaign', 'Review first month analytics', 'Identify top 5 performing content pieces'], status: 'pending' },
];

const plan90 = [
  { month: 'Month 2', title: 'Growth Acceleration', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', desc: 'Scale what\'s working. Double content output on highest traffic pages. Launch referral program.' },
  { month: 'Month 3', title: 'Revenue Optimization', icon: Target, color: 'from-violet-500 to-purple-600', desc: 'Implement conversion rate optimization on landing pages. A/B test CTAs, pricing & email sequences.' },
  { month: 'Ongoing', title: 'Brand Authority', icon: Flag, color: 'from-amber-500 to-orange-500', desc: 'Build thought leadership via podcast appearances, PR mentions, and industry partnerships.' },
];

const statusConfig = {
  done: { color: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500', label: 'Complete' },
  active: { color: 'text-violet-600 bg-violet-50 border-violet-200', dot: 'bg-violet-500 animate-pulse', label: 'In Progress' },
  pending: { color: 'text-slate-500 bg-slate-50 border-slate-200', dot: 'bg-slate-300', label: 'Upcoming' },
};

const channels = [
  { name: 'SEO & Content', budget: 35, icon: Globe, color: 'from-emerald-400 to-teal-500' },
  { name: 'Paid Social Ads', budget: 25, icon: Users, color: 'from-pink-400 to-rose-500' },
  { name: 'Email Marketing', budget: 20, icon: Mail, color: 'from-blue-400 to-indigo-500' },
  { name: 'Google Ads', budget: 15, icon: Target, color: 'from-amber-400 to-orange-500' },
  { name: 'Influencer', budget: 5, icon: Megaphone, color: 'from-violet-400 to-purple-500' },
];

const MarketingStrategy = () => {
  const [tab, setTab] = useState('plan30');
  const tabs = [
    { id: 'plan30', label: '30-Day Plan', icon: Calendar },
    { id: 'plan90', label: '90-Day Roadmap', icon: TrendingUp },
    { id: 'channels', label: 'Channel Mix', icon: BarChart2 },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Marketing Strategy</h1>
          <p className="text-slate-500 text-sm mt-0.5">AI-generated growth roadmap tailored to your business</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-all">
          <Zap className="h-4 w-4" /> Regenerate with AI
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Strategy Score', value: '87/100', icon: TrendingUp, color: 'from-violet-500 to-purple-600' },
          { label: 'Active Tasks', value: '8/32', icon: CheckCircle, color: 'from-emerald-500 to-teal-600' },
          { label: 'Est. Monthly Reach', value: '42K+', icon: Users, color: 'from-cyan-500 to-blue-500' },
          { label: 'Projected ROI', value: '340%', icon: BarChart2, color: 'from-amber-500 to-orange-500' },
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

        <div className="p-6">
          <AnimatePresence mode="wait">
            {tab === 'plan30' && (
              <motion.div key="plan30" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                {plan30.map((week, i) => {
                  const s = statusConfig[week.status];
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
                      <div className="grid sm:grid-cols-2 gap-2 pl-5">
                        {week.tasks.map((task, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-slate-700">
                            <CheckCircle className={`h-3.5 w-3.5 shrink-0 ${week.status === 'done' ? 'text-emerald-500' : 'text-slate-300'}`} />
                            {task}
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
                  {plan90.map((phase, i) => {
                    const Icon = phase.icon;
                    return (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}
                        className="relative mb-6 last:mb-0">
                        <div className={`absolute -left-5 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${phase.color} text-white shadow-sm`}>
                          <Icon className="h-3 w-3" />
                        </div>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 hover:border-violet-100 transition-all">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{phase.month}</span>
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
                      { metric: 'Organic Traffic', target: '+150%', current: '2.4K/mo', projected: '6K/mo' },
                      { metric: 'Email Subscribers', target: '+300%', current: '480', projected: '1,920' },
                      { metric: 'Qualified Leads', target: '+200%', current: '18/mo', projected: '54/mo' },
                    ].map((t, i) => (
                      <div key={i} className="rounded-xl bg-white border border-violet-100 p-4">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">{t.metric}</p>
                        <p className="text-2xl font-extrabold text-gradient">{t.target}</p>
                        <p className="text-xs text-slate-400 mt-1">{t.current} → <span className="font-semibold text-slate-600">{t.projected}</span></p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {tab === 'channels' && (
              <motion.div key="channels" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                <p className="text-sm text-slate-500">Recommended budget allocation based on your industry and business profile.</p>
                <div className="space-y-3">
                  {channels.map((ch, i) => (
                    <motion.div key={ch.name} initial={{ opacity: 0, x: -15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                      className="flex items-center gap-4">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${ch.color} text-white shadow-sm`}>
                        <ch.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm font-semibold text-slate-700">{ch.name}</span>
                          <span className="text-sm font-bold text-slate-800">{ch.budget}%</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <motion.div className={`h-full rounded-full bg-gradient-to-r ${ch.color}`}
                            initial={{ width: 0 }} animate={{ width: `${ch.budget}%` }} transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }} />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Content Calendar */}
                <div className="mt-4 rounded-2xl border border-slate-100 p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-violet-500" /> Content Calendar Snapshot
                  </h4>
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
                      <div key={d} className="text-[10px] font-bold text-slate-400 pb-2">{d}</div>
                    ))}
                    {[
                      { day: 'Blog Post', color: 'bg-violet-100 text-violet-700' },
                      { day: 'Instagram', color: 'bg-pink-100 text-pink-700' },
                      { day: 'Email', color: 'bg-blue-100 text-blue-700' },
                      { day: 'Twitter', color: 'bg-sky-100 text-sky-700' },
                      { day: 'LinkedIn', color: 'bg-indigo-100 text-indigo-700' },
                      { day: '—', color: 'bg-slate-50 text-slate-300' },
                      { day: 'Story', color: 'bg-rose-100 text-rose-600' },
                    ].map((item, i) => (
                      <div key={i} className={`rounded-lg px-1 py-2 text-[9px] font-semibold ${item.color}`}>{item.day}</div>
                    ))}
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

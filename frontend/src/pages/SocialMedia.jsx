import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Share2, TrendingUp, Users, Heart, MessageCircle, Eye, BarChart2, ArrowUp, ArrowDown } from 'lucide-react';

const Instagram = (props) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const Twitter = (props) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

const Linkedin = (props) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

const Facebook = (props) => (
  <svg viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const platforms = [
  {
    name: 'Instagram', icon: Instagram, color: 'from-pink-500 to-rose-500', bg: 'bg-pink-50',
    followers: '12.4K', growth: '+8.2%', up: true,
    engagement: '4.7%', reach: '28.5K', impressions: '94.2K',
    posts: 34, avgLikes: 412, avgComments: 28,
    weekly: [55, 70, 60, 85, 75, 90, 80],
  },
  {
    name: 'Twitter/X', icon: Twitter, color: 'from-sky-400 to-blue-500', bg: 'bg-sky-50',
    followers: '5.8K', growth: '+3.1%', up: true,
    engagement: '2.1%', reach: '11.2K', impressions: '38.9K',
    posts: 82, avgLikes: 94, avgComments: 12,
    weekly: [40, 35, 50, 45, 65, 55, 60],
  },
  {
    name: 'LinkedIn', icon: Linkedin, color: 'from-blue-600 to-indigo-600', bg: 'bg-blue-50',
    followers: '3.2K', growth: '+12.4%', up: true,
    engagement: '5.9%', reach: '8.4K', impressions: '22.1K',
    posts: 16, avgLikes: 187, avgComments: 43,
    weekly: [30, 45, 55, 70, 65, 80, 75],
  },
  {
    name: 'Facebook', icon: Facebook, color: 'from-blue-500 to-blue-700', bg: 'bg-blue-50',
    followers: '8.1K', growth: '-1.2%', up: false,
    engagement: '1.3%', reach: '15.6K', impressions: '41.3K',
    posts: 22, avgLikes: 98, avgComments: 7,
    weekly: [70, 60, 55, 45, 50, 40, 38],
  },
];

const MiniBarChart = ({ data, color }) => (
  <div className="flex items-end gap-0.5 h-10">
    {data.map((v, i) => (
      <motion.div key={i} className={`flex-1 rounded-sm ${color}`}
        initial={{ height: 0 }} animate={{ height: `${v}%` }} transition={{ delay: i * 0.06, duration: 0.4 }} />
    ))}
  </div>
);

const SocialMedia = () => {
  const [selected, setSelected] = useState(platforms[0]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-800">Social Media Analysis</h1>
        <p className="text-slate-500 text-sm mt-0.5">Multi-platform performance tracking and engagement insights</p>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {platforms.map((p, i) => {
          const Icon = p.icon;
          const isSelected = selected.name === p.name;
          return (
            <motion.button key={p.name} onClick={() => setSelected(p)}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className={`text-left bg-white rounded-2xl border shadow-sm p-4 transition-all hover:shadow-md ${isSelected ? 'border-violet-200 ring-2 ring-violet-100' : 'border-slate-100'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${p.color} text-white shadow-sm`}>
                  <Icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-bold flex items-center gap-0.5 ${p.up ? 'text-emerald-600' : 'text-red-500'}`}>
                  {p.up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                  {p.growth}
                </span>
              </div>
              <p className="text-lg font-extrabold text-slate-800">{p.followers}</p>
              <p className="text-xs text-slate-400 font-medium">{p.name} Followers</p>
              <div className="mt-2">
                <MiniBarChart data={p.weekly} color={`bg-gradient-to-t ${p.color} opacity-70`} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Detail Panel */}
      <motion.div key={selected.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        className="grid gap-5 lg:grid-cols-3">

        {/* Metrics */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${selected.color} text-white shadow`}>
              <selected.icon className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{selected.name} Performance</h2>
              <p className="text-xs text-slate-400">Last 30 days summary</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            {[
              { label: 'Followers', value: selected.followers, icon: Users },
              { label: 'Engagement Rate', value: selected.engagement, icon: Heart },
              { label: 'Total Reach', value: selected.reach, icon: Eye },
              { label: 'Impressions', value: selected.impressions, icon: BarChart2 },
              { label: 'Total Posts', value: selected.posts, icon: MessageCircle },
              { label: 'Avg Likes', value: selected.avgLikes, icon: TrendingUp },
            ].map((m, i) => (
              <motion.div key={m.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                className="rounded-xl bg-slate-50 border border-slate-100 p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <m.icon className="h-3.5 w-3.5 text-violet-400" />
                  <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">{m.label}</span>
                </div>
                <p className="text-lg font-extrabold text-slate-800">{m.value}</p>
              </motion.div>
            ))}
          </div>

          {/* Weekly Bar Chart */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">Weekly Engagement (Last 7 Days)</p>
            <div className="flex items-end gap-2 h-28">
              {selected.weekly.map((v, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-[10px] text-slate-400">{v}</span>
                  <motion.div className={`w-full rounded-t-sm bg-gradient-to-t ${selected.color} opacity-80`}
                    initial={{ height: 0 }} animate={{ height: `${v}%` }} transition={{ delay: i * 0.07, duration: 0.5 }} />
                  <span className="text-[9px] text-slate-400">{['M','T','W','T','F','S','S'][i]}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Share2 className="h-4 w-4 text-violet-500" /> AI Insights
          </h3>
          <div className="space-y-3">
            {[
              { tip: `Post 3–4x/week on ${selected.name} for maximum algorithm reach. Consistency is the top growth driver.`, type: 'action' },
              { tip: `Engagement rate of ${selected.engagement} is ${parseFloat(selected.engagement) > 3 ? 'above' : 'below'} industry average. ${parseFloat(selected.engagement) > 3 ? 'Leverage this by launching a UGC campaign.' : 'Focus on interactive content like polls and Q&A.'}`, type: 'insight' },
              { tip: 'Optimal posting time: Tuesday–Thursday between 9–11am for B2B audiences. Schedule content in advance.', type: 'timing' },
              { tip: 'Cross-promote your highest-performing posts to other platforms to amplify reach without extra content creation effort.', type: 'strategy' },
            ].map((r, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                className="rounded-xl bg-violet-50 border border-violet-100 p-3 text-xs text-slate-700 leading-relaxed">
                <span className="block font-bold text-violet-600 text-[10px] uppercase tracking-wider mb-1">
                  {r.type === 'action' ? '⚡ Action' : r.type === 'insight' ? '💡 Insight' : r.type === 'timing' ? '🕒 Timing' : '📈 Strategy'}
                </span>
                {r.tip}
              </motion.div>
            ))}
          </div>

          {/* Growth Score */}
          <div className="mt-5 rounded-xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 p-4 text-center">
            <p className="text-xs font-bold text-slate-500 mb-1">Overall Social Score</p>
            <p className="text-4xl font-extrabold text-gradient">{selected.up ? '74' : '51'}</p>
            <p className="text-xs text-slate-400 mt-0.5">/ 100</p>
          </div>
        </div>
      </motion.div>

      {/* Content Recommendations */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-pink-500" /> Top Content Ideas for This Week
        </h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: 'Behind-the-Scenes Reel', desc: 'Show your product development process. BTS content drives 2x the shares.', format: 'Video', platform: 'Instagram' },
            { title: 'Case Study Thread', desc: 'Break down a customer success story into 6–8 tweet thread for LinkedIn and Twitter.', format: 'Text', platform: 'LinkedIn' },
            { title: 'Infographic: 5 Tips', desc: 'Design a "5 tips for [your niche]" infographic — static posts still dominate algorithmic reach.', format: 'Image', platform: 'Facebook' },
          ].map((idea, i) => (
            <motion.div key={i} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1 }}
              className="rounded-xl border border-slate-100 bg-slate-50 p-4 hover:border-violet-100 hover:bg-violet-50/30 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{idea.format}</span>
                <span className="text-xs text-slate-400">{idea.platform}</span>
              </div>
              <p className="text-sm font-bold text-slate-800 mb-1">{idea.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{idea.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;

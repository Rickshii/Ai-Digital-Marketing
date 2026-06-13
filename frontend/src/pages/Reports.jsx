import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Download, BarChart2, Calendar, TrendingUp, Globe,
  Briefcase, Search, Share2, Megaphone, CheckCircle, Clock,
  Star, Filter, Eye, Trash2, Plus, Printer, X, Sparkles, Shield, Key
} from 'lucide-react';
import { reportsAPI } from '../services/api';

const typeConfig = {
  comprehensive: { label: 'Full Report', color: 'from-violet-500 to-purple-600', icon: BarChart2, bg: 'bg-violet-50 text-violet-700 border-violet-200' },
  audit: { label: 'Website Audit', color: 'from-cyan-500 to-blue-500', icon: Globe, bg: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  social: { label: 'Social Media', color: 'from-pink-500 to-rose-500', icon: Share2, bg: 'bg-pink-50 text-pink-700 border-pink-200' },
  seo: { label: 'SEO Report', color: 'from-emerald-500 to-teal-600', icon: Search, bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  strategy: { label: 'Strategy Plan', color: 'from-amber-500 to-orange-500', icon: Megaphone, bg: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const ScorePill = ({ label, score }) => {
  if (score === undefined || score === null) return null;
  const color = score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : score >= 55 ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100';
  return (
    <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${color}`}>
      {label}: {score}%
    </span>
  );
};

const Reports = () => {
  const [filter, setFilter] = useState('all');
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reportsList, setReportsList] = useState([]);
  const [previewReport, setPreviewReport] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await reportsAPI.getReports();
      setReportsList(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const newReport = await reportsAPI.generateReport({
        title: `Comprehensive Marketing Audit ${new Date().toLocaleDateString()}`,
        type: 'comprehensive'
      });
      setReportsList(prev => [newReport, ...prev]);
    } catch (err) {
      console.error('Error generating report:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (report) => {
    const divider = "=================================================================";
    const content = `
${divider}
                       MARKETERAI REPORT
${divider}
Report ID:   ${report.report_id}
Title:       ${report.title}
Date:        ${new Date(report.created_at).toLocaleString()}
Type:        ${report.type.toUpperCase()}

SCORES OVERVIEW:
${Object.entries(report.scores || {}).map(([k, v]) => `  - ${k.toUpperCase()}: ${v}%`).join('\n')}

BUSINESS DESCRIPTION:
  - Name:      ${report.business_overview?.business_name || 'N/A'}
  - Industry:  ${report.business_overview?.industry_type || 'N/A'}
  - Website:   ${report.business_overview?.website_url || 'N/A'}
  - Location:  ${report.business_overview?.business_location || 'N/A'}

WEBSITE AUDIT RESULTS:
  - Health Score:  ${report.website_audit?.health_score || 0}%
  - Load Speed:    ${report.website_audit?.load_time || 'N/A'}
  - HTTPS Secure:  ${report.website_audit?.is_https ? 'Yes' : 'No'}
  - Suggestions:
${(report.website_audit?.improvement_suggestions || []).map((s, idx) => `    ${idx + 1}. ${s}`).join('\n')}

SEO AUDIT RESULTS:
  - SEO Score:     ${report.seo_audit?.seo_score || 0}%
  - Sitemap.xml:   ${report.seo_audit?.has_sitemap ? 'Detected' : 'Missing'}
  - Robots.txt:    ${report.seo_audit?.has_robots_txt ? 'Detected' : 'Missing'}

SOCIAL MEDIA ANALYSIS:
  - Social Score:  ${report.social_media_analysis?.social_score || 0}%
  - Channels Analyzed:
    * Facebook:    ${report.social_media_analysis?.facebook_url || 'Not Set'}
    * Instagram:   ${report.social_media_analysis?.instagram_url || 'Not Set'}
    * LinkedIn:    ${report.social_media_analysis?.linkedin_url || 'Not Set'}
    * YouTube:     ${report.social_media_analysis?.youtube_url || 'Not Set'}
  - Growth Actions:
${(report.social_media_analysis?.growth_suggestions || []).map((s, idx) => `    * ${s}`).join('\n')}

MARKETING STRATEGY PROJECTIONS:
  - Recommended Lead Magnet: ${report.marketing_strategy?.lead_gen_strategy?.recommended_lead_magnet || 'N/A'}
  - Est. Monthly Reach:      ${report.marketing_strategy?.reach_estimate || 'N/A'}
  - Projected ROI:           ${report.marketing_strategy?.projected_roi || 'N/A'}

${divider}
  This document serves as a consolidated performance report.
  Powered by MarketerAI Digital Marketing Consultant.
${divider}
`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/ /g, '_')}_report.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = (report) => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print - ${report.title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; background-color: #ffffff; }
            .header { border-bottom: 2px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; color: #0f172a; margin: 0; }
            .logo-placeholder { font-size: 18px; font-weight: 800; color: #8b5cf6; letter-spacing: -0.5px; }
            .meta { font-size: 12px; color: #64748b; margin-top: 5px; }
            .scores { display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin: 30px 0; }
            .score-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 15px; text-align: center; background: #f8fafc; }
            .score-name { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 5px; }
            .score-val { font-size: 24px; font-weight: 800; color: #8b5cf6; }
            .section { margin-bottom: 35px; page-break-inside: avoid; }
            .section-title { font-size: 14px; font-weight: 700; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 15px; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; }
            .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .metric-row { display: flex; justify-content: space-between; border-bottom: 1px solid #f1f5f9; padding: 6px 0; font-size: 13px; }
            .metric-label { color: #64748b; font-weight: 500; }
            .metric-value { color: #1e293b; font-weight: 600; }
            .suggestion-list { list-style-type: none; padding-left: 0; margin: 0; }
            .suggestion-item { background: #f8fafc; border-left: 4px solid #8b5cf6; padding: 12px; margin-bottom: 10px; font-size: 13px; border-radius: 0 8px 8px 0; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">${report.title}</div>
              <div class="meta">Report ID: ${report.report_id} | Created: ${new Date(report.created_at).toLocaleDateString()} | Type: Comprehensive Audit</div>
            </div>
            <div class="logo-placeholder">MarketerAI ✨</div>
          </div>
          
          <div class="section">
            <div class="section-title">Consolidated Performance Scores</div>
            <div class="scores">
              ${Object.entries(report.scores || {}).map(([k, v]) => `
                <div class="score-card">
                  <div class="score-name">${k}</div>
                  <div class="score-val">${v}%</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="section">
            <div class="section-title">Business & Website Overview</div>
            <div class="grid-2">
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a;">Company Profile</h4>
                <div class="metric-row"><span class="metric-label">Business Name</span><span class="metric-value">${report.business_overview?.business_name || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">Industry Type</span><span class="metric-value">${report.business_overview?.industry_type || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">Location</span><span class="metric-value">${report.business_overview?.business_location || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">Target Audience</span><span class="metric-value">${report.business_overview?.target_audience || 'N/A'}</span></div>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 14px; color: #0f172a;">Technical Site Analysis</h4>
                <div class="metric-row"><span class="metric-label">Website URL</span><span class="metric-value">${report.website_audit?.website_url || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">Load Time</span><span class="metric-value">${report.website_audit?.load_time || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">HTTPS Enabled</span><span class="metric-value">${report.website_audit?.is_https ? 'Yes (Secure)' : 'No (Insecure)'}</span></div>
                <div class="metric-row"><span class="metric-label">Sitemap.xml</span><span class="metric-value">${report.seo_audit?.has_sitemap ? 'Detected' : 'Missing'}</span></div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">SEO & Speed Improvement Actions</div>
            <ul class="suggestion-list">
              ${(report.website_audit?.improvement_suggestions || []).map(s => `
                <li class="suggestion-item">
                  <strong>Technical:</strong> ${s}
                </li>
              `).join('') || '<p style="font-size: 13px; color: #64748b;">No high-priority site issues identified.</p>'}
            </ul>
          </div>

          <div class="section">
            <div class="section-title">Social Media Presence & Channels</div>
            <div class="grid-2">
              <div>
                <div class="metric-row"><span class="metric-label">Facebook Profile</span><span class="metric-value">${report.social_media_analysis?.facebook_url ? 'Configured' : 'Not Connected'}</span></div>
                <div class="metric-row"><span class="metric-label">Instagram Profile</span><span class="metric-value">${report.social_media_analysis?.instagram_url ? 'Configured' : 'Not Connected'}</span></div>
              </div>
              <div>
                <div class="metric-row"><span class="metric-label">LinkedIn Profile</span><span class="metric-value">${report.social_media_analysis?.linkedin_url ? 'Configured' : 'Not Connected'}</span></div>
                <div class="metric-row"><span class="metric-label">YouTube Channel</span><span class="metric-value">${report.social_media_analysis?.youtube_url ? 'Configured' : 'Not Connected'}</span></div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Strategic Growth Recommendations</div>
            <div class="grid-2">
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a;">Lead Capture Model</h4>
                <div class="metric-row"><span class="metric-label">Suggested Lead Magnet</span><span class="metric-value">${report.marketing_strategy?.lead_gen_strategy?.recommended_lead_magnet || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">Projected Monthly Reach</span><span class="metric-value">${report.marketing_strategy?.reach_estimate || 'N/A'}</span></div>
                <div class="metric-row"><span class="metric-label">Projected Campaign ROI</span><span class="metric-value">${report.marketing_strategy?.projected_roi || 'N/A'}</span></div>
              </div>
              <div>
                <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a;">Brand Messaging</h4>
                <p style="font-size: 12px; margin: 0; color: #475569; line-height: 1.5;">
                  ${report.marketing_strategy?.branding_strategy?.positioning_statement || 'N/A'}
                </p>
              </div>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        await reportsAPI.deleteReport(id);
        setReportsList(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        console.error('Error deleting report:', err);
      }
    }
  };

  const filtered = filter === 'all' ? reportsList : reportsList.filter(r => r.type === filter);

  const stats = [
    { label: 'Reports Generated', value: reportsList.length.toString(), icon: FileText, color: 'from-violet-500 to-purple-600' },
    { label: 'Avg Report Score', value: reportsList.length ? `${Math.round(reportsList.reduce((acc, r) => acc + (r.scores?.business || 50), 0) / reportsList.length)}%` : '0%', icon: TrendingUp, color: 'from-emerald-500 to-teal-600' },
    { label: 'Total Audits Saved', value: (reportsList.length * 2).toString(), icon: Globe, color: 'from-cyan-500 to-blue-500' },
    { label: 'Active Business', value: reportsList.length ? '1' : '0', icon: Briefcase, color: 'from-amber-500 to-orange-500' },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="h-12 w-12 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold animate-pulse">Loading reports history...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Reports Center</h1>
          <p className="text-slate-500 text-sm mt-0.5">Download, manage, and print consolidated digital marketing audit reports</p>
        </div>
        <motion.button
          onClick={handleGenerate}
          disabled={generating}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 disabled:opacity-60 transition-all"
        >
          {generating ? (
            <><div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Compiling Report...</>
          ) : (
            <><Plus className="h-4 w-4" /> Compile Consolidated Report</>
          )}
        </motion.button>
      </div>

      {/* Analytics Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-extrabold text-slate-800">{stat.value}</p>
              <p className="text-xs text-slate-400 leading-tight">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filter Tabs + Report List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex gap-1 flex-wrap">
            {[
              { id: 'all', label: 'All Reports' },
              { id: 'comprehensive', label: 'Full Audits' },
            ].map(f => (
              <button key={f.id} onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${filter === f.id ? 'bg-violet-100 text-violet-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            <span>{filtered.length} reports</span>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 px-4">
            <FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700">No reports generated yet</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">Compile your first consolidated report to see details of your business scores and marketing strategies.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            <AnimatePresence>
              {filtered.map((report, i) => {
                const cfg = typeConfig[report.type] || typeConfig.comprehensive;
                const Icon = cfg.icon;
                return (
                  <motion.div key={report.id}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-all"
                  >
                    {/* Icon */}
                    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${cfg.color} text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h4 className="text-sm font-bold text-slate-800 truncate">{report.title}</h4>
                        <span className={`text-[10px] font-bold border rounded-full px-2 py-0.5 ${cfg.bg}`}>{report.report_id}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(report.created_at).toLocaleDateString()}</span>
                        <span>Type: {cfg.label}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(report.scores || {}).map(([key, val]) =>
                          val !== undefined && val !== null ? (
                            <ScorePill key={key} label={key.charAt(0).toUpperCase() + key.slice(1)} score={val} />
                          ) : null
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => setPreviewReport(report)}
                        className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-all">
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </button>
                      <motion.button
                        onClick={() => handleDownload(report)}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-90 transition-all"
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </motion.button>
                      <button onClick={() => handleDelete(report.id)} className="rounded-xl p-2 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Report Preview Modal */}
      <AnimatePresence>
        {previewReport && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full">
                    Report ID: {previewReport.report_id}
                  </span>
                  <h2 className="text-lg font-extrabold mt-2">{previewReport.title}</h2>
                  <p className="text-xs text-violet-200 mt-1">Compiled on {new Date(previewReport.created_at).toLocaleString()}</p>
                </div>
                <button onClick={() => setPreviewReport(null)} className="rounded-xl p-1.5 bg-white/10 hover:bg-white/20 transition-all text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {/* Consolidated Scores */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-2 mb-3">Report Scores Summary</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(previewReport.scores || {}).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{key}</p>
                        <p className="text-lg font-extrabold mt-1 text-violet-600">
                          {val}%
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Overview */}
                {previewReport.business_overview && (
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Briefcase className="h-4 w-4" />Business Profile Info</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Business Name</span>
                        <span className="font-semibold text-slate-800">{previewReport.business_overview.business_name}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Industry</span>
                        <span className="font-semibold text-slate-800">{previewReport.business_overview.industry_type}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Website URL</span>
                        <span className="font-semibold text-slate-800">{previewReport.business_overview.website_url}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Location</span>
                        <span className="font-semibold text-slate-800">{previewReport.business_overview.business_location}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Website Audit Overview */}
                {previewReport.website_audit && (
                  <div className="border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Globe className="h-4 w-4" />Website Technical Quality</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block">Health Score</span>
                        <span className="font-bold text-slate-800">{previewReport.website_audit.health_score}%</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Load Speed</span>
                        <span className="font-bold text-slate-800">{previewReport.website_audit.load_time}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Secure HTTPS</span>
                        <span className="font-bold text-slate-800">{previewReport.website_audit.is_https ? 'Yes (Secure)' : 'No (Insecure)'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Readability Score</span>
                        <span className="font-bold text-slate-800">{previewReport.website_audit.readability_score || 0}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Technical Recommendations</span>
                      <div className="space-y-1.5">
                        {(previewReport.website_audit.improvement_suggestions || []).map((s, idx) => (
                          <div key={idx} className="flex gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            <span className="text-violet-500 font-bold">•</span>
                            <span>{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* SEO Audit & Errors */}
                {previewReport.seo_audit && (
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Search className="h-4 w-4" />SEO Performance & Meta</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-slate-400 block">Sitemap.xml</span>
                        <span className="font-semibold text-slate-800">{previewReport.seo_audit.has_sitemap ? 'Configured' : 'Missing'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Robots.txt</span>
                        <span className="font-semibold text-slate-800">{previewReport.seo_audit.has_robots_txt ? 'Configured' : 'Missing'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Canonical URL</span>
                        <span className="font-semibold text-slate-800">{previewReport.seo_audit.has_canonical ? 'Active' : 'Missing'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Social Media Presence */}
                {previewReport.social_media_analysis && (
                  <div className="border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Share2 className="h-4 w-4" />Social Platform Connections</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-400 block">Facebook Profile</span>
                        <span className="font-semibold text-slate-800 truncate block">{previewReport.social_media_analysis.facebook_url || 'Not connected'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Instagram Profile</span>
                        <span className="font-semibold text-slate-800 truncate block">{previewReport.social_media_analysis.instagram_url || 'Not connected'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">LinkedIn Profile</span>
                        <span className="font-semibold text-slate-800 truncate block">{previewReport.social_media_analysis.linkedin_url || 'Not connected'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">YouTube Channel</span>
                        <span className="font-semibold text-slate-800 truncate block">{previewReport.social_media_analysis.youtube_url || 'Not connected'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Strategy Snapshot */}
                {previewReport.marketing_strategy && (
                  <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><Megaphone className="h-4 w-4" />Strategic Content Action Plan</h4>
                    <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                      <div>
                        <span className="text-slate-400 block">Projected Campaign ROI</span>
                        <span className="font-bold text-slate-800">{previewReport.marketing_strategy.projected_roi}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Est. Monthly Reach</span>
                        <span className="font-bold text-slate-800">{previewReport.marketing_strategy.reach_estimate}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Recommended Lead Magnet</span>
                        <span className="font-bold text-slate-800 truncate block">{previewReport.marketing_strategy.lead_gen_strategy?.recommended_lead_magnet}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">30-Day Calendar Highlights</span>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {(previewReport.marketing_strategy.plan_30_day || []).map((week, idx) => (
                          <div key={idx} className="bg-white border border-slate-100 p-3 rounded-xl">
                            <span className="text-[10px] font-bold text-violet-600 block">{week.week}: {week.title}</span>
                            <span className="text-[11px] text-slate-500 line-clamp-2 mt-1">{(week.tasks || []).join(', ')}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center gap-3">
                <button onClick={() => handlePrint(previewReport)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 bg-white transition-all">
                  <Printer className="h-4 w-4" /> Print Report
                </button>
                <div className="flex gap-2">
                  <button onClick={() => setPreviewReport(null)}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-150 bg-white transition-all">
                    Close
                  </button>
                  <button onClick={() => handleDownload(previewReport)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95 transition-all">
                    <Download className="h-4 w-4" /> Download PDF
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Report Features List */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" /> What's Included in Every Report
        </h3>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            'Executive Summary Dashboard',
            'Business Profile Completeness Score',
            'Website Health & Speed Metrics',
            'SEO Keyword & On-Page Analysis',
            'Social Media Performance Breakdown',
            'AI-Generated Marketing Recommendations',
            '30-Day Action Plan with Priority Tasks',
            'Competitor Benchmark Comparison',
            'ROI Projections & Growth Forecasts',
          ].map((feature, i) => (
            <motion.div key={feature} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.06 }}
              className="flex items-center gap-2 text-sm text-slate-600">
              <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
              {feature}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Reports;

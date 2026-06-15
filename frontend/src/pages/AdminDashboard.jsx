import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Trash2, Eye,
  TrendingUp, Globe, AlertCircle
} from 'lucide-react';
import { adminAPI } from '../services/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users'); // 'users', 'reports', 'analytics'
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const loadAdminData = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const [statsData, usersData, reportsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getReports()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setReports(reportsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setErrorMsg('Unauthorized access or connection to admin endpoints failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This will remove all their audits, profile, and reports.')) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        // Refresh stats
        const statsData = await adminAPI.getStats();
        setStats(statsData);
      } catch (err) {
        alert(err.response?.data?.detail || 'Failed to delete user.');
      }
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to permanently delete this report?')) {
      try {
        await adminAPI.deleteReport(reportId);
        setReports(prev => prev.filter(r => r.id !== reportId));
        // Refresh stats
        const statsData = await adminAPI.getStats();
        setStats(statsData);
      } catch (err) {
        alert('Failed to delete report.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="h-12 w-12 border-4 border-violet-500/30 border-t-violet-600 rounded-full animate-spin" />
        <p className="text-slate-500 font-semibold animate-pulse">Retrieving administrative database stats...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="max-w-md mx-auto mt-12 bg-white rounded-3xl border border-red-100 shadow-xl p-6 text-center">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800">Admin Privileges Required</h3>
        <p className="text-slate-500 text-sm mt-1 mb-6">{errorMsg}</p>
        <button onClick={() => window.location.href = '/'} className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 py-2.5 text-sm font-semibold text-white">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.report_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">System Admin Control</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage user accounts, monitor system audits, and oversee generated reports</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Users Registered', value: stats?.total_users || 0, icon: Users, color: 'from-violet-500 to-purple-600' },
          { label: 'Active (Last 30 Days)', value: stats?.active_users || 0, icon: Clock, color: 'from-emerald-500 to-teal-600' },
          { label: 'Total Scraped Audits', value: stats?.total_audits || 0, icon: Globe, color: 'from-cyan-500 to-blue-500' },
          { label: 'Consolidated Reports', value: stats?.total_reports || 0, icon: FileText, color: 'from-amber-500 to-orange-500' },
        ].map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.08 }}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${card.color} text-white shadow-sm`}>
              <card.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">{card.value}</p>
              <p className="text-xs text-slate-400 font-medium leading-normal">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs Menu */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-4 gap-4">
          <div className="flex gap-1 border border-slate-100 p-1 rounded-xl bg-slate-50 self-start">
            {[
              { id: 'users', label: 'User Management', count: users.length },
              { id: 'reports', label: 'Report Management', count: reports.length },
              { id: 'analytics', label: 'System Analytics', count: null }
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab.label} {tab.count !== null && <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab !== 'analytics' && (
            <div className="relative max-w-xs w-full sm:self-end">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder={activeTab === 'users' ? "Search users by name or email..." : "Search reports by title, ID or user..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all bg-slate-50/50"
              />
            </div>
          )}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === 'users' && (
              <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">User Details</th>
                      <th className="pb-3 font-semibold">System Role</th>
                      <th className="pb-3 font-semibold">Joined Date</th>
                      <th className="pb-3 text-center font-semibold">Audits</th>
                      <th className="pb-3 text-center font-semibold">Reports</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-8 text-slate-400">No users found matching search terms.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5">
                            <div>
                              <p className="font-bold text-slate-800">{user.full_name}</p>
                              <p className="text-[11px] text-slate-400">{user.email}</p>
                            </div>
                          </td>
                          <td className="py-3.5">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold border ${user.role === 'admin' ? 'bg-violet-50 text-violet-700 border-violet-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5 text-center font-bold text-slate-700">{user.audits_count || 0}</td>
                          <td className="py-3.5 text-center font-bold text-slate-700">{user.reports_count || 0}</td>
                          <td className="py-3.5 text-right">
                            <button
                              onClick={() => handleDeleteUser(user.id)}
                              className="rounded-xl p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'reports' && (
              <motion.div key="reports" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="pb-3 font-semibold">Report Info</th>
                      <th className="pb-3 font-semibold">User Email</th>
                      <th className="pb-3 font-semibold">Compilation Date</th>
                      <th className="pb-3 font-semibold">Category</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {filteredReports.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="text-center py-8 text-slate-400">No reports generated or found in system.</td>
                      </tr>
                    ) : (
                      filteredReports.map((report) => (
                        <tr key={report.id} className="hover:bg-slate-50/50">
                          <td className="py-3.5">
                            <div>
                              <p className="font-bold text-slate-800">{report.title}</p>
                              <p className="text-[10px] text-slate-400">{report.report_id}</p>
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-700">{report.user_email}</td>
                          <td className="py-3.5 text-slate-500">{new Date(report.created_at).toLocaleDateString()}</td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center rounded-full bg-violet-50 text-violet-700 px-2 py-0.5 text-[10px] font-bold border border-violet-100 uppercase">
                              {report.type}
                            </span>
                          </td>
                          <td className="py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleDeleteReport(report.id)}
                                className="rounded-xl p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === 'analytics' && (
              <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  {[
                    { label: 'Avg SEO Audit Score', value: `${stats?.avg_seo_score || 0}%`, desc: 'Average calculated across all website crawler files' },
                    { label: 'Avg Website Health', value: `${stats?.avg_health_score || 0}%`, desc: 'Consolidated page speed and accessibility metrics' },
                    { label: 'Avg Social Media Score', value: `${stats?.avg_social_score || 0}%`, desc: 'Based on Facebook, Instagram & LinkedIn connections' }
                  ].map((metric, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">{metric.label}</span>
                      <p className="text-3xl font-extrabold text-violet-600 mt-2">{metric.value}</p>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">{metric.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Audit Trends Chart */}
                <div className="rounded-2xl border border-slate-100 p-5">
                  <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <BarChart2 className="h-4 w-4 text-violet-500" /> New Account Registration Frequency
                  </h4>
                  <div className="flex items-end gap-3 h-28 mt-6">
                    {(stats?.registration_history || []).map((item, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-xs font-bold text-slate-500">{item.count}</span>
                        <div
                          className="w-full rounded-t-lg bg-gradient-to-t from-violet-500 to-indigo-400"
                          style={{ height: `${Math.max(8, (item.count / (stats?.total_users || 1)) * 100)}%` }}
                        />
                        <span className="text-[10px] text-slate-400">{item.month}</span>
                      </div>
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

export default AdminDashboard;

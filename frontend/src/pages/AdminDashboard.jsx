import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Trash2, Globe, AlertCircle, Users, Clock, FileText, Search, BarChart2,
  Eye, Edit2, X, Check, CreditCard, Calendar, Filter, Building, User, Key,
  PlusCircle, DollarSign, Tag, Save
} from 'lucide-react';
import { adminAPI } from '../services/api';
import { useToast, ToastContainer } from '../components/Toast';

const BLANK_PLAN = { plan_name: '', price: '', duration_days: '', description: '' };

const AdminDashboard = () => {
  const { toasts, addToast, removeToast } = useToast();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Filters
  const [roleFilter, setRoleFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');

  // User modals
  const [previewUser, setPreviewUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [editForm, setEditForm] = useState({ full_name: '', email: '', role: 'user', password: '' });
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [editFormError, setEditFormError] = useState('');

  // Plan management state
  const [plans, setPlans] = useState([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);  // plan object being edited
  const [showNewPlanForm, setShowNewPlanForm] = useState(false);
  const [newPlan, setNewPlan] = useState(BLANK_PLAN);
  const [planSaving, setPlanSaving] = useState(false);
  const [planError, setPlanError] = useState('');

  // Payments state
  const [pendingPayments, setPendingPayments] = useState([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [platformQRFile, setPlatformQRFile] = useState(null);
  const [qrTimestamp, setQrTimestamp] = useState(Date.now()); // cache-buster after upload
  const [currentQRUrl, setCurrentQRUrl] = useState(null);    // URL from DB
  const API_BASE = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`).replace(/\/api\/?$/, '');

  const buildQRSrc = (url, ts) => {
    if (!url) return null;
    if (url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${ts}`;
    }
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE}${cleanUrl}?v=${ts}`;
  };

  const fetchPendingPayments = async () => {
    setPaymentsLoading(true);
    try {
      const data = await adminAPI.getPendingPayments();
      setPendingPayments(data);
    } catch(err) {
      console.error(err);
    } finally {
      setPaymentsLoading(false);
    }
  };

  const handleApprovePayment = async (id) => {
    if(!window.confirm("Approve and activate this plan?")) return;
    try {
      await adminAPI.approvePayment(id);
      setPendingPayments(prev => prev.filter(p => p.id !== id));
      addToast('Payment approved and subscription activated.', 'success');
    } catch(err) {
      addToast(err.response?.data?.detail || 'Failed to approve payment.', 'error');
    }
  };

  const handleRejectPayment = async (id) => {
    if(!window.confirm("Reject this payment?")) return;
    try {
      await adminAPI.rejectPayment(id);
      setPendingPayments(prev => prev.filter(p => p.id !== id));
      addToast('Payment rejected.', 'info');
    } catch(err) {
      addToast(err.response?.data?.detail || 'Failed to reject payment.', 'error');
    }
  };

  const handleUploadQR = async (e) => {
    e.preventDefault();
    if(!platformQRFile) return;
    const fd = new FormData();
    fd.append("file", platformQRFile);
    try {
      const result = await adminAPI.uploadPlatformQR(fd);
      const newUrl = result.qr_image_url || result.url || null;
      setCurrentQRUrl(newUrl);
      setQrTimestamp(Date.now());
      addToast('Platform QR code uploaded and saved successfully.', 'success');
      setPlatformQRFile(null);
    } catch(err) {
      addToast('Failed to upload QR code: ' + (err.response?.data?.detail || err.message), 'error');
    }
  };

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const data = await adminAPI.getPlans();
      setPlans(data);
    } catch (err) {
      console.error('Failed to load plans', err);
    } finally {
      setPlansLoading(false);
    }
  };

  const handleSaveNewPlan = async (e) => {
    e.preventDefault();
    setPlanError('');
    if (!newPlan.plan_name || !newPlan.price || !newPlan.duration_days) {
      setPlanError('Plan name, price, and duration are required.');
      return;
    }
    setPlanSaving(true);
    try {
      const created = await adminAPI.createPlan({
        plan_name: newPlan.plan_name,
        price: parseFloat(newPlan.price),
        duration_days: parseInt(newPlan.duration_days),
        description: newPlan.description || null,
      });
      setPlans(prev => [...prev, created]);
      setNewPlan(BLANK_PLAN);
      setShowNewPlanForm(false);
      addToast(`Plan "${created.plan_name}" created successfully. It is now live on the Subscription page.`, 'success');
    } catch (err) {
      setPlanError(err.response?.data?.detail || 'Failed to create plan.');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleUpdatePlan = async (e) => {
    e.preventDefault();
    setPlanError('');
    setPlanSaving(true);
    try {
      const updated = await adminAPI.updatePlan(editingPlan.id, {
        plan_name: editingPlan.plan_name,
        price: parseFloat(editingPlan.price),
        duration_days: parseInt(editingPlan.duration_days),
        description: editingPlan.description || null,
      });
      setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingPlan(null);
      addToast(`Plan "${updated.plan_name}" updated successfully. Changes are live on the Subscription page.`, 'success');
    } catch (err) {
      setPlanError(err.response?.data?.detail || 'Failed to update plan.');
    } finally {
      setPlanSaving(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Delete this plan? Existing subscriptions will not be affected.')) return;
    try {
      await adminAPI.deletePlan(planId);
      setPlans(prev => prev.filter(p => p.id !== planId));
      addToast('Plan deleted successfully.', 'success');
    } catch (err) {
      addToast(err.response?.data?.detail || 'Failed to delete plan.', 'error');
    }
  };

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [statsData, usersData, reportsData] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getUsers(),
        adminAPI.getReports()
      ]);
      setStats(statsData);
      setUsers(usersData);
      setReports(reportsData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setErrorMsg('Unauthorized access or connection to admin endpoints failed.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'plans') fetchPlans();
    if (activeTab === 'payments') {
      fetchPendingPayments();
      adminAPI.getQRUrl().then(url => {
        if (url) setCurrentQRUrl(url);
      }).catch(() => {});
    }
  }, [activeTab]);

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to permanently delete this user? This will remove all their audits, profile, and reports.')) {
      try {
        await adminAPI.deleteUser(userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
        if (previewUser && previewUser.id === userId) setPreviewUser(null);
        const statsData = await adminAPI.getStats();
        setStats(statsData);
        addToast('User deleted successfully.', 'success');
      } catch (err) {
        addToast(err.response?.data?.detail || 'Failed to delete user.', 'error');
      }
    }
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to permanently delete this report?')) {
      try {
        await adminAPI.deleteReport(reportId);
        setReports(prev => prev.filter(r => r.id !== reportId));
        const statsData = await adminAPI.getStats();
        setStats(statsData);
        addToast('Report deleted successfully.', 'success');
      } catch (err) {
        console.error('Failed to delete report:', err);
        addToast('Failed to delete report.', 'error');
      }
    }
  };

  const handleOpenEdit = (user) => {
    setEditUser(user);
    setEditForm({
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      password: ''
    });
    setEditFormError('');
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setEditFormLoading(true);
    setEditFormError('');
    try {
      const updatePayload = {
        full_name: editForm.full_name,
        email: editForm.email,
        role: editForm.role
      };
      if (editForm.password.trim().length > 0) {
        updatePayload.password = editForm.password;
      }
      
      await adminAPI.updateUser(editUser.id, updatePayload);
      
      // Update local state
      setUsers(prev => prev.map(u => u.id === editUser.id ? { ...u, ...updatePayload } : u));
      if (previewUser && previewUser.id === editUser.id) {
        setPreviewUser(prev => ({ ...prev, ...updatePayload }));
      }
      setEditUser(null);
      addToast('User account updated successfully.', 'success');
    } catch (err) {
      setEditFormError(err.response?.data?.detail || 'Failed to update user account details.');
    } finally {
      setEditFormLoading(false);
    }
  };

  const handleOpenPreview = async (userId) => {
    try {
      const detailedUser = await adminAPI.previewUser(userId);
      setPreviewUser(detailedUser);
    } catch (err) {
      addToast('Failed to retrieve user profile: ' + (err.response?.data?.detail || err.message), 'error');
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

  // Filter Logic
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;

    // Plan evaluation
    let matchesPlan = true;
    const hasAccess = u.access?.has_access;
    const trialActive = u.access?.trial_active;
    const subActive = u.access?.subscription_active;

    if (planFilter === 'trial') {
      matchesPlan = hasAccess && trialActive && !subActive;
    } else if (planFilter === 'active') {
      matchesPlan = hasAccess && subActive;
    } else if (planFilter === 'expired') {
      matchesPlan = !hasAccess;
    }

    return matchesSearch && matchesRole && matchesPlan;
  });

  const filteredReports = reports.filter(r =>
    r.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.report_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          <Shield className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">System Admin Control</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage user accounts, check subscription statuses, and monitor generated reports</p>
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
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-100 px-5 pt-4 pb-4 gap-4 bg-slate-50/20">
          <div className="flex gap-1 border border-slate-100 p-1 rounded-xl bg-slate-50 self-start">
            {[
              { id: 'users',     label: 'User Management',  count: users.length },
              { id: 'reports',   label: 'Report Management', count: reports.length },
              { id: 'plans',     label: 'Plan Pricing',      count: plans.length || null },
              { id: 'payments',  label: 'QR Payments',       count: pendingPayments.length || null },
              { id: 'analytics', label: 'System Analytics',  count: null },
            ].map(tab => (
              <button key={tab.id} onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
                className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-800'}`}>
                {tab.label} {tab.count !== null && <span className="ml-1 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">{tab.count}</span>}
              </button>
            ))}
          </div>

          {activeTab === 'users' && (
            <div className="flex flex-wrap items-center gap-3">
              {/* Role filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                <Filter className="h-3.5 w-3.5 text-slate-400" />
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="bg-transparent outline-none pr-1">
                  <option value="all">All Roles</option>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Plan filter */}
              <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                <CreditCard className="h-3.5 w-3.5 text-slate-400" />
                <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="bg-transparent outline-none pr-1">
                  <option value="all">All Plans</option>
                  <option value="trial">Free Trial</option>
                  <option value="active">Paid Subscription</option>
                  <option value="expired">Expired Access</option>
                </select>
              </div>

              {/* Search */}
              <div className="relative max-w-xs w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all bg-white"
                />
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search reports..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all bg-white"
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
                      <th className="pb-3 font-semibold">Subscription Status</th>
                      <th className="pb-3 font-semibold">Joined Date</th>
                      <th className="pb-3 text-center font-semibold">Audits</th>
                      <th className="pb-3 text-center font-semibold">Reports</th>
                      <th className="pb-3 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-8 text-slate-400">No users found matching search & filter terms.</td>
                      </tr>
                    ) : (
                      filteredUsers.map((user) => {
                        const hasAccess = user.access?.has_access;
                        const trialActive = user.access?.trial_active;
                        const subActive = user.access?.subscription_active;
                        const planName = user.access?.subscription_plan;
                        const daysLeft = user.access?.trial_days_left;

                        let statusBadge = (
                          <span className="inline-flex items-center rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold border border-red-100">
                            Expired
                          </span>
                        );
                        if (user.role === 'admin') {
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-[10px] font-bold border border-indigo-100">
                              Unlimited Admin
                            </span>
                          );
                        } else if (hasAccess && subActive) {
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[10px] font-bold border border-emerald-100">
                              {planName || 'Paid Active'}
                            </span>
                          );
                        } else if (hasAccess && trialActive) {
                          statusBadge = (
                            <span className="inline-flex items-center rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[10px] font-bold border border-amber-100 animate-pulse">
                              Trial: {daysLeft} Days left
                            </span>
                          );
                        }

                        return (
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
                            <td className="py-3.5">{statusBadge}</td>
                            <td className="py-3.5 text-slate-500">{new Date(user.created_at).toLocaleDateString()}</td>
                            <td className="py-3.5 text-center font-bold text-slate-700">{user.audits_count || 0}</td>
                            <td className="py-3.5 text-center font-bold text-slate-700">{user.reports_count || 0}</td>
                            <td className="py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenPreview(user.id)}
                                  title="Preview User Data"
                                  className="rounded-xl p-2 text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-all"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(user)}
                                  title="Edit User Credentials"
                                  className="rounded-xl p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(user.id)}
                                  title="Delete User"
                                  className="rounded-xl p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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

            {activeTab === 'plans' && (
              <motion.div key="plans" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-5">
                {/* Header row */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Subscription Plan Pricing</h3>
                    <p className="text-slate-400 text-xs mt-0.5">Prices shown here are used on the public Subscription page and during order creation.</p>
                  </div>
                  <button
                    onClick={() => { setShowNewPlanForm(true); setPlanError(''); }}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md shadow-violet-500/10 transition-all"
                  >
                    <PlusCircle className="h-4 w-4" /> Add New Plan
                  </button>
                </div>

                {planError && (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl p-3 text-red-700 text-xs font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0" />{planError}
                  </div>
                )}

                {/* New plan form */}
                {showNewPlanForm && (
                  <motion.form
                    onSubmit={handleSaveNewPlan}
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-violet-50 border border-violet-100 rounded-2xl p-5 space-y-4"
                  >
                    <h4 className="font-bold text-violet-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5" /> New Subscription Plan
                    </h4>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-violet-700 uppercase">Plan Name</label>
                        <input required value={newPlan.plan_name} onChange={e => setNewPlan(p => ({ ...p, plan_name: e.target.value }))}
                          placeholder="e.g. 2 Months"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-violet-200 outline-none focus:border-violet-500 bg-white font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-violet-700 uppercase">Price (₹)</label>
                        <input required type="number" min="1" step="0.01" value={newPlan.price} onChange={e => setNewPlan(p => ({ ...p, price: e.target.value }))}
                          placeholder="e.g. 799"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-violet-200 outline-none focus:border-violet-500 bg-white font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-violet-700 uppercase">Duration (Days)</label>
                        <input required type="number" min="1" value={newPlan.duration_days} onChange={e => setNewPlan(p => ({ ...p, duration_days: e.target.value }))}
                          placeholder="e.g. 60"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-violet-200 outline-none focus:border-violet-500 bg-white font-medium" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-violet-700 uppercase">Description</label>
                        <input value={newPlan.description} onChange={e => setNewPlan(p => ({ ...p, description: e.target.value }))}
                          placeholder="Short description (optional)"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-violet-200 outline-none focus:border-violet-500 bg-white font-medium" />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => { setShowNewPlanForm(false); setNewPlan(BLANK_PLAN); setPlanError(''); }}
                        className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100">
                        Cancel
                      </button>
                      <button type="submit" disabled={planSaving}
                        className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50">
                        <Save className="h-3.5 w-3.5" /> {planSaving ? 'Saving...' : 'Save Plan'}
                      </button>
                    </div>
                  </motion.form>
                )}

                {/* Plans grid */}
                {plansLoading ? (
                  <div className="flex items-center justify-center py-12 text-slate-400 text-sm gap-3">
                    <div className="h-5 w-5 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
                    Loading plans...
                  </div>
                ) : plans.length === 0 ? (
                  <div className="text-center py-12 text-slate-400 text-sm">
                    No plans found. Click "Add New Plan" to create the first one.
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {plans.map(plan => (
                      <div key={plan.id} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm space-y-3">
                        {editingPlan?.id === plan.id ? (
                          /* Inline edit form */
                          <form onSubmit={handleUpdatePlan} className="space-y-3">
                            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Editing Plan</h4>
                            <div className="space-y-2">
                              <input required value={editingPlan.plan_name} onChange={e => setEditingPlan(p => ({ ...p, plan_name: e.target.value }))}
                                placeholder="Plan name" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 font-medium" />
                              <div className="grid grid-cols-2 gap-2">
                                <input required type="number" min="1" step="0.01" value={editingPlan.price} onChange={e => setEditingPlan(p => ({ ...p, price: e.target.value }))}
                                  placeholder="Price ₹" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 font-medium" />
                                <input required type="number" min="1" value={editingPlan.duration_days} onChange={e => setEditingPlan(p => ({ ...p, duration_days: e.target.value }))}
                                  placeholder="Days" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 font-medium" />
                              </div>
                              <input value={editingPlan.description || ''} onChange={e => setEditingPlan(p => ({ ...p, description: e.target.value }))}
                                placeholder="Description" className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 outline-none focus:border-violet-500 font-medium" />
                            </div>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setEditingPlan(null)}
                                className="flex-1 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50">
                                Cancel
                              </button>
                              <button type="submit" disabled={planSaving}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-violet-600 text-white text-xs font-bold hover:bg-violet-700 disabled:opacity-50">
                                <Check className="h-3.5 w-3.5" />{planSaving ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </form>
                        ) : (
                          /* Display view */
                          <>
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-extrabold text-slate-800 text-sm">{plan.plan_name}</p>
                                <p className="text-slate-400 text-[11px] mt-0.5">{plan.duration_days} days access</p>
                              </div>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-xl font-black text-violet-600">₹{Number(plan.price).toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                            {plan.description && (
                              <p className="text-slate-400 text-[11px] leading-relaxed border-t border-slate-50 pt-2">{plan.description}</p>
                            )}
                            <div className="flex gap-2 pt-1 border-t border-slate-50">
                              <button onClick={() => { setEditingPlan({ ...plan }); setPlanError(''); }}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition-all">
                                <Edit2 className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button onClick={() => handleDeletePlan(plan.id)}
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-bold hover:bg-red-100 transition-all">
                                <Trash2 className="h-3.5 w-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <p className="text-[10px] text-slate-400 text-center pt-2">
                  Changes take effect immediately on the public Subscription page. Existing active subscriptions are not affected.
                </p>
              </motion.div>
            )}

            {activeTab === 'payments' && (
              <motion.div key="payments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2 mb-4"><CreditCard className="h-5 w-5 text-indigo-500" /> Platform QR Management</h3>
                  <div className="flex flex-col sm:flex-row gap-6 items-start">
                    {/* QR Preview */}
                    <div className="flex-shrink-0 text-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Current QR Code</p>
                      {currentQRUrl ? (
                        <img
                          key={qrTimestamp}
                          src={buildQRSrc(currentQRUrl, qrTimestamp)}
                          alt="Current Platform QR"
                          className="w-36 h-36 border-4 border-white rounded-xl shadow-md object-contain bg-white"
                          onLoad={() => console.log('[AdminDashboard] QR preview loaded')}
                          onError={(e) => { e.target.src = 'https://placehold.co/144x144?text=Not+Set'; }}
                        />
                      ) : (
                        <div className="w-36 h-36 border-4 border-dashed border-slate-200 rounded-xl flex items-center justify-center bg-white">
                          <p className="text-[10px] text-slate-400 font-semibold text-center px-2">No QR uploaded yet</p>
                        </div>
                      )}
                    </div>
                    {/* Upload Form */}
                    <form onSubmit={handleUploadQR} className="flex-1 space-y-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload New QR Code</label>
                        <input 
                          key={qrTimestamp}
                          type="file" 
                          accept="image/*"
                          onChange={e => setPlatformQRFile(e.target.files[0])}
                          className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                        />
                      </div>
                      <button type="submit" disabled={!platformQRFile} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md transition-all">
                        Save QR Code
                      </button>
                      <p className="text-[10px] text-slate-400">After uploading, the new QR will appear instantly in the user checkout modal.</p>
                    </form>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-extrabold text-slate-800 flex items-center gap-2 text-lg"><Clock className="h-5 w-5 text-amber-500" /> Pending QR Payments ({pendingPayments.length})</h3>
                  
                  {paymentsLoading ? (
                    <div className="py-10 text-center text-slate-500 text-sm animate-pulse">Loading payments...</div>
                  ) : pendingPayments.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-sm bg-slate-50 rounded-2xl border border-slate-100">No pending payments.</div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-y border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="p-4 rounded-tl-2xl">Payment ID</th>
                            <th className="p-4">User Details</th>
                            <th className="p-4">Plan Name</th>
                            <th className="p-4">Amount</th>
                            <th className="p-4">Transaction / UTR</th>
                            <th className="p-4">Proof</th>
                            <th className="p-4 rounded-tr-2xl text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600 font-medium">
                          {pendingPayments.map(pay => (
                            <tr key={pay.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 text-slate-500 font-mono">#{pay.id}</td>
                              <td className="p-4">
                                <span className="block font-bold text-slate-800">{pay.user_full_name || pay.user_email || 'N/A'}</span>
                                <span className="text-[10px] text-slate-400">{pay.user_email}</span>
                              </td>
                              <td className="p-4 font-bold text-indigo-600">{pay.plan_name || 'N/A'}</td>
                              <td className="p-4 font-black text-slate-800">₹{pay.amount}</td>
                              <td className="p-4 font-mono text-slate-500">{pay.razorpay_order_id}</td>
                              <td className="p-4">
                                {pay.payment_proof ? (
                                  <a href={`${API_BASE}${pay.payment_proof}`} target="_blank" className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md font-bold text-[10px] w-fit">
                                    <Eye className="h-3 w-3" /> View Image
                                  </a>
                                ) : 'None'}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center justify-center gap-2">
                                  <button onClick={() => handleApprovePayment(pay.id)} className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-100" title="Approve">
                                    <Check className="h-4 w-4" />
                                  </button>
                                  <button onClick={() => handleRejectPayment(pay.id)} className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors border border-rose-100" title="Reject">
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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

      {/* ──────────── PREVIEW USER MODAL ──────────── */}
      <AnimatePresence>
        {previewUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-3xl overflow-hidden max-h-[85vh] flex flex-col"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-violet-100 text-violet-700 rounded-xl flex items-center justify-center">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-base">{previewUser.full_name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{previewUser.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewUser(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                {/* Status and Join Date Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 rounded-2xl p-4">
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Access Status</span>
                    <p className="font-bold text-slate-800 mt-1">
                      {previewUser.role === 'admin' 
                        ? 'Unlimited Admin' 
                        : previewUser.access?.has_access 
                          ? (previewUser.access?.subscription_active ? 'Paid Subscription' : 'Trial Active')
                          : 'Expired'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Plan Name</span>
                    <p className="font-bold text-slate-800 mt-1">
                      {previewUser.access?.subscription_plan || (previewUser.access?.trial_active ? 'Free Trial' : 'None')}
                    </p>
                  </div>
                  {previewUser.access?.trial_active && !previewUser.access?.subscription_active && (
                    <div>
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Trial Days Left</span>
                      <p className="font-bold text-amber-600 mt-1">{previewUser.access?.trial_days_left} Days</p>
                    </div>
                  )}
                  {previewUser.access?.subscription_expiry && (
                    <div>
                      <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Expiry Date</span>
                      <p className="font-bold text-slate-800 mt-1">
                        {new Date(previewUser.access.subscription_expiry).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px]">Joined Date</span>
                    <p className="font-bold text-slate-800 mt-1">
                      {new Date(previewUser.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Business Profiles Section */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <Building className="h-4 w-4 text-indigo-500" /> Business Profiles ({previewUser.business_profiles?.length || 0})
                  </h4>
                  {previewUser.business_profiles?.length === 0 ? (
                    <p className="text-slate-400 bg-slate-50/50 p-4 rounded-2xl text-center">No business profiles created yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {previewUser.business_profiles.map((profile, idx) => (
                        <div key={idx} className="border border-slate-100 rounded-2xl p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 text-xs">{profile.business_name}</span>
                            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-indigo-100">{profile.business_category}</span>
                          </div>
                          <p className="text-slate-400 leading-relaxed">{profile.description}</p>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-t border-slate-50 pt-2.5 text-[11px] text-slate-500">
                            <div>
                              <span className="font-semibold text-slate-400">Website:</span>{' '}
                              <a href={profile.website_url} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline">{profile.website_url}</a>
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Industry:</span> {profile.industry_type}
                            </div>
                            <div>
                              <span className="font-semibold text-slate-400">Location:</span> {profile.city}, {profile.country}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment History Section */}
                <div className="space-y-3">
                  <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-emerald-500" /> Payment History ({previewUser.payments?.length || 0})
                  </h4>
                  {previewUser.payments?.length === 0 ? (
                    <p className="text-slate-400 bg-slate-50/50 p-4 rounded-2xl text-center">No subscription payments logged.</p>
                  ) : (
                    <div className="border border-slate-100 rounded-2xl overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase text-[10px]">
                            <th className="p-3">Order ID</th>
                            <th className="p-3">Payment ID</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                            <th className="p-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-slate-600 font-semibold">
                          {previewUser.payments.map((pay) => (
                            <tr key={pay.id} className="hover:bg-slate-50/30">
                              <td className="p-3 font-mono text-slate-700">{pay.razorpay_order_id}</td>
                              <td className="p-3 font-mono text-slate-700">{pay.razorpay_payment_id || 'N/A'}</td>
                              <td className="p-3 font-bold text-slate-800">₹{pay.amount}</td>
                              <td className="p-3">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold border ${pay.status === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                  {pay.status}
                                </span>
                              </td>
                              <td className="p-3 text-slate-400">{new Date(pay.created_at).toLocaleDateString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/40 flex justify-end gap-2.5">
                <button
                  onClick={() => {
                    handleOpenEdit(previewUser);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                >
                  Edit Account Credentials
                </button>
                <button
                  onClick={() => setPreviewUser(null)}
                  className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-bold shadow-md shadow-violet-500/10"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────── EDIT USER MODAL ──────────── */}
      <AnimatePresence>
        {editUser && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-1.5">
                  <Edit2 className="h-5 w-5 text-indigo-600" /> Edit User Account
                </h3>
                <button
                  onClick={() => setEditUser(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="p-6 space-y-4 text-xs font-semibold">
                {editFormError && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{editFormError}</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider text-[10px]">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editForm.full_name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, full_name: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider text-[10px]">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium text-slate-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-slate-400 uppercase tracking-wider text-[10px]">System Access Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium text-slate-700 bg-white"
                  >
                    <option value="user">User (Subscription Gated)</option>
                    <option value="admin">Administrator (Unlimited Access)</option>
                  </select>
                </div>

                <div className="space-y-1.5 pt-1.5 border-t border-slate-50">
                  <label className="text-slate-400 uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Key className="h-3 w-3 text-slate-400" /> New Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep current"
                    value={editForm.password}
                    onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium text-slate-700"
                  />
                  <p className="text-[10px] text-slate-400 font-medium leading-normal mt-1">Must be at least 6 characters if you want to reset it.</p>
                </div>

                <div className="pt-4 flex justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setEditUser(null)}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editFormLoading}
                    className="px-5 py-2 rounded-xl bg-violet-600 text-white hover:bg-violet-700 font-bold shadow-md shadow-violet-500/10 disabled:opacity-50"
                  >
                    {editFormLoading ? 'Saving Changes...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;

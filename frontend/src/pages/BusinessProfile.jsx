import React, { useState, useEffect } from 'react';
import { businessAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Check, AlertTriangle, Globe, Phone, Mail,
  MapPin, Users, Sparkles, ChevronRight, ChevronLeft, Briefcase,
  Edit2, Save, TrendingUp, Calendar, Loader, X
} from 'lucide-react';

const STEPS = ['Business Info', 'Contact & Location', 'Social Media', 'Review'];

const ScoreRing = ({ score }) => {
  const r = 40, c = 2 * Math.PI * r;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#8B5CF6';
  return (
    <div className="relative flex items-center justify-center" style={{ width: 100, height: 100 }}>
      <svg width="100" height="100" viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
        <motion.circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round" strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c - (score / 100) * c }}
          transition={{ duration: 1.2, ease: 'easeOut' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-extrabold text-slate-800">{score}%</span>
        <span className="text-[9px] text-slate-400 font-medium">Score</span>
      </div>
    </div>
  );
};

const StepDot = ({ step, current, label }) => {
  const done = current > step, active = current === step;
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-all ${
        done ? 'bg-violet-500 border-violet-500 text-white' :
        active ? 'border-violet-500 text-violet-600 bg-violet-50' :
        'border-slate-200 text-slate-400 bg-white'
      }`}>
        {done ? <Check className="h-4 w-4" /> : step + 1}
      </div>
      <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-violet-600' : 'text-slate-400'}`}>{label}</span>
    </div>
  );
};

const Field = ({ label, icon: Icon, children, required }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
      {label}{required && <span className="text-violet-500 ml-0.5">*</span>}
    </label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />}
      {React.cloneElement(children, {
        className: `w-full ${Icon ? 'pl-9' : 'pl-4'} pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 focus:bg-white transition-all ${children.props.className || ''}`
      })}
    </div>
  </div>
);

const BusinessProfile = () => {
  const [profiles, setProfiles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showWizard, setShowWizard] = useState(false);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Edit Mode States
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const [form, setForm] = useState({
    business_name: '', industry_type: '', website_url: '', description: '',
    business_location: '', target_audience: '', contact_number: '', email: '',
    social_media_links: { linkedin: '', twitter: '', facebook: '', instagram: '' }
  });

  useEffect(() => {
    businessAPI.getProfiles().then(d => {
      setProfiles(d);
      if (d.length > 0) setSelected(d[0]);
    }).finally(() => setLoading(false));
  }, []);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  const setSocial = (k, v) => setForm(p => ({ ...p, social_media_links: { ...p.social_media_links, [k]: v } }));

  const liveScore = () => {
    const fields = [form.business_name, form.industry_type, form.website_url, form.description,
      form.business_location, form.target_audience, form.contact_number, form.email,
      form.social_media_links.linkedin, form.social_media_links.twitter,
      form.social_media_links.facebook, form.social_media_links.instagram];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const openWizard = () => {
    setForm({ business_name: '', industry_type: '', website_url: '', description: '',
      business_location: '', target_audience: '', contact_number: '', email: '',
      social_media_links: { linkedin: '', twitter: '', facebook: '', instagram: '' } });
    setStep(0); setError(''); setEditMode(false); setShowWizard(true);
  };

  const handleSubmit = async () => {
    setError(''); setSubmitting(true);
    try {
      const profile = await businessAPI.createProfile(form);
      setProfiles(p => [profile, ...p]);
      setSelected(profile);
      setShowWizard(false);
      triggerNotification('Profile Created Successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create profile.');
    } finally { setSubmitting(false); }
  };

  const startEditMode = (profile) => {
    setEditForm({
      business_name: profile.business_name || '',
      industry_type: profile.industry_type || '',
      website_url: profile.website_url || '',
      description: profile.description || '',
      business_location: profile.business_location || '',
      target_audience: profile.target_audience || '',
      contact_number: profile.contact_number || '',
      email: profile.email || '',
      social_media_links: {
        linkedin: profile.social_media_links?.linkedin || '',
        twitter: profile.social_media_links?.twitter || '',
        facebook: profile.social_media_links?.facebook || '',
        instagram: profile.social_media_links?.instagram || ''
      }
    });
    setError('');
    setEditMode(true);
  };

  const setEditField = (k, v) => setEditForm(p => ({ ...p, [k]: v }));
  const setEditSocialField = (k, v) => setEditForm(p => ({ ...p, social_media_links: { ...p.social_media_links, [k]: v } }));

  const handleUpdate = async () => {
    if (!editForm.business_name || !editForm.industry_type) {
      setError('Business Name and Industry Type are required.');
      return;
    }
    setError(''); setSubmitting(true);
    try {
      const updated = await businessAPI.updateProfile(selected.id, editForm);
      setProfiles(prev => prev.map(p => p.id === selected.id ? updated : p));
      setSelected(updated);
      setEditMode(false);
      triggerNotification('Profile Updated Successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update profile.');
    } finally { setSubmitting(false); }
  };

  const triggerNotification = (msg) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this business profile?')) return;
    await businessAPI.deleteProfile(id);
    const updated = profiles.filter(p => p.id !== id);
    setProfiles(updated);
    setSelected(updated[0] || null);
    setEditMode(false);
    triggerNotification('Profile Deleted Successfully!');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      <AnimatePresence>
        {successMessage && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-2xl bg-emerald-500 border border-emerald-400/30 px-5 py-3.5 text-sm font-bold text-white shadow-xl shadow-emerald-500/20">
            <Check className="h-5 w-5 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Business Analysis</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure business profiles to generate AI marketing scores</p>
        </div>
        <motion.button onClick={openWizard} whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 hover:opacity-95 transition-all">
          <Plus className="h-4 w-4" /> Add Business
        </motion.button>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* List */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">Your Businesses ({profiles.length})</p>
          {loading ? (
            [...Array(2)].map((_, i) => <div key={i} className="h-20 rounded-2xl bg-slate-100 animate-pulse" />)
          ) : profiles.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-200 p-8 text-center bg-white shadow-sm">
              <Briefcase className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-400">No profiles yet.</p>
              <button onClick={openWizard} className="mt-2 text-xs text-violet-600 font-semibold hover:underline">+ Add your first business</button>
            </div>
          ) : profiles.map(profile => (
            <motion.div key={profile.id} onClick={() => { setSelected(profile); setEditMode(false); }} layout
              className={`cursor-pointer rounded-2xl border p-4 bg-white shadow-sm transition-all ${
                selected?.id === profile.id ? 'border-violet-300 ring-2 ring-violet-100' : 'border-slate-100 hover:border-slate-200'
              }`}>
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-800 text-sm truncate">{profile.business_name}</p>
                  <p className="text-xs text-violet-500 font-medium mt-0.5">{profile.industry_type}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    profile.completeness_score >= 80 ? 'bg-emerald-50 text-emerald-600' :
                    profile.completeness_score >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-violet-50 text-violet-600'
                  }`}>{profile.completeness_score}%</span>
                  <button onClick={e => handleDelete(profile.id, e)} className="rounded-lg p-1 text-slate-300 hover:text-red-400 hover:bg-red-50 transition-all">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                  initial={{ width: 0 }} animate={{ width: `${profile.completeness_score}%` }} transition={{ duration: 0.8 }} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Detail / Edit View */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {!selected ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 flex flex-col items-center justify-center text-center">
                <Briefcase className="h-12 w-12 text-slate-200 mb-4" />
                <p className="text-base font-bold text-slate-500 font-sans">Select a business or add a new one</p>
                <p className="text-sm text-slate-400 mt-1">Your AI marketing scorecard will appear here</p>
              </div>
            ) : editMode ? (
              /* Edit View Form */
              <motion.div key="edit" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Edit Business Details</h3>
                    <p className="text-xs text-slate-400">Modify information for {selected.business_name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setEditMode(false)}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                      Cancel
                    </button>
                    <button onClick={handleUpdate} disabled={submitting}
                      className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md hover:opacity-95 transition-all">
                      {submitting ? <Loader className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                      Save Changes
                    </button>
                  </div>
                </div>

                {error && <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">{error}</div>}

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Business Name" icon={Briefcase} required>
                      <input type="text" value={editForm.business_name} onChange={e => setEditField('business_name', e.target.value)} />
                    </Field>
                    <Field label="Industry Type" required>
                      <input type="text" value={editForm.industry_type} onChange={e => setEditField('industry_type', e.target.value)} />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Website URL" icon={Globe}>
                      <input type="url" value={editForm.website_url} onChange={e => setEditField('website_url', e.target.value)} />
                    </Field>
                    <Field label="Location" icon={MapPin}>
                      <input type="text" value={editForm.business_location} onChange={e => setEditField('business_location', e.target.value)} />
                    </Field>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <Field label="Contact Email" icon={Mail}>
                      <input type="email" value={editForm.email} onChange={e => setEditField('email', e.target.value)} />
                    </Field>
                    <Field label="Contact Phone" icon={Phone}>
                      <input type="tel" value={editForm.contact_number} onChange={e => setEditField('contact_number', e.target.value)} />
                    </Field>
                  </div>

                  <Field label="Target Audience" icon={Users}>
                    <input type="text" value={editForm.target_audience} onChange={e => setEditField('target_audience', e.target.value)} />
                  </Field>

                  <Field label="Business Description">
                    <textarea rows={3} value={editForm.description} onChange={e => setEditField('description', e.target.value)} className="resize-none" />
                  </Field>

                  {/* Social Links */}
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Social Media Links</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {['linkedin', 'twitter', 'facebook', 'instagram'].map(p => (
                        <Field key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} icon={Globe}>
                          <input type="url" value={editForm.social_media_links?.[p] || ''} onChange={e => setEditSocialField(p, e.target.value)} />
                        </Field>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              /* Detail View Mode */
              <motion.div key={selected.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                {/* Header Card */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <ScoreRing score={selected.completeness_score} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">{selected.industry_type}</span>
                        <button onClick={() => startEditMode(selected)}
                          className="flex items-center gap-1.5 text-xs text-violet-600 border border-violet-200 rounded-xl px-3.5 py-1.5 hover:bg-violet-50 transition-all font-semibold shadow-sm bg-white">
                          <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                        </button>
                      </div>
                      <h2 className="text-xl font-extrabold text-slate-800 mt-2">{selected.business_name}</h2>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-slate-500">
                        {selected.website_url && <a href={selected.website_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-violet-600"><Globe className="h-3.5 w-3.5" />{selected.website_url}</a>}
                        {selected.business_location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{selected.business_location}</span>}
                        {selected.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{selected.email}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Score History Block */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-50 pb-3 mb-3">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-violet-500" /> Completeness Score History
                    </h3>
                    {selected.last_updated && (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> Last updated: {new Date(selected.last_updated).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    {(selected.score_history || [{ score: selected.completeness_score, date: selected.last_updated || new Date().toISOString() }]).map((hist, idx, arr) => (
                      <div key={idx} className="flex items-center gap-2">
                        <div className="rounded-xl bg-slate-50 border border-slate-100 p-2 flex flex-col items-center min-w-[75px] shadow-sm">
                          <span className="text-xs font-extrabold text-slate-700">{hist.score}%</span>
                          <span className="text-[9px] text-slate-400 mt-0.5">{new Date(hist.date).toLocaleDateString()}</span>
                        </div>
                        {idx < arr.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-slate-300" />}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Missing Info */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <AlertTriangle className="h-4 w-4 text-amber-500" /> Missing Information
                    </h3>
                    {!selected.missing_info_report?.length ? (
                      <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 rounded-xl p-3">
                        <Check className="h-4 w-4" /> Profile 100% complete!
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {selected.missing_info_report.map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* Social Media */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-violet-500" /> Social Channels
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selected.social_media_links || {}).map(([platform, url]) =>
                        url ? (
                          <a key={platform} href={url} target="_blank" rel="noreferrer"
                            className="text-xs font-semibold bg-violet-50 text-violet-600 border border-violet-100 rounded-lg px-2.5 py-1 capitalize hover:bg-violet-100 transition-all">
                            {platform}
                          </a>
                        ) : null
                      )}
                      {!Object.values(selected.social_media_links || {}).some(Boolean) && (
                        <p className="text-xs text-slate-400">No social links added.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* AI Suggestions */}
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                    <Sparkles className="h-4 w-4 text-violet-500 animate-pulse" /> AI Marketing Suggestions
                  </h3>
                  <div className="space-y-3">
                    {(selected.improvement_suggestions || []).map((tip, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                        className="flex gap-3 rounded-xl bg-violet-50 border border-violet-100 p-3.5">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-bold">{i + 1}</span>
                        <p className="text-xs text-slate-700 leading-relaxed">{tip}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── WIZARD MODAL ── */}
      <AnimatePresence>
        {showWizard && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* Wizard Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                <h2 className="text-lg font-extrabold mb-4">New Business Profile</h2>
                <div className="flex items-center gap-2">
                  {STEPS.map((label, i) => (
                    <React.Fragment key={label}>
                      <StepDot step={i} current={step} label={label} />
                      {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > i ? 'bg-white' : 'bg-white/25'}`} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Live Score */}
              <div className="flex items-center justify-between px-6 pt-4 pb-2">
                <p className="text-sm font-bold text-slate-700">{STEPS[step]}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Live Score:</span>
                  <span className={`text-sm font-extrabold ${liveScore() >= 70 ? 'text-emerald-600' : liveScore() >= 40 ? 'text-amber-600' : 'text-violet-600'}`}>
                    {liveScore()}%
                  </span>
                  <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500"
                      animate={{ width: `${liveScore()}%` }} transition={{ duration: 0.4 }} />
                  </div>
                </div>
              </div>

              {/* Wizard Body */}
              <div className="px-6 pb-4 max-h-72 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Business Name" icon={Briefcase} required>
                          <input type="text" value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Acme Agency" />
                        </Field>
                        <Field label="Industry Type" required>
                          <input type="text" value={form.industry_type} onChange={e => set('industry_type', e.target.value)} placeholder="SaaS / Retail / Healthcare" />
                        </Field>
                      </div>
                      <Field label="Website URL" icon={Globe}>
                        <input type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://yoursite.com" />
                      </Field>
                      <Field label="Business Description">
                        <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your business in detail (50+ words recommended)..." className="resize-none" />
                      </Field>
                    </motion.div>
                  )}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Email" icon={Mail}>
                          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@business.com" />
                        </Field>
                        <Field label="Phone" icon={Phone}>
                          <input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+1 555 000-0000" />
                        </Field>
                      </div>
                      <Field label="Location" icon={MapPin}>
                        <input type="text" value={form.business_location} onChange={e => set('business_location', e.target.value)} placeholder="San Francisco, CA" />
                      </Field>
                      <Field label="Target Audience" icon={Users}>
                        <input type="text" value={form.target_audience} onChange={e => set('target_audience', e.target.value)} placeholder="e.g. B2B SaaS founders, eco-conscious shoppers" />
                      </Field>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      {['linkedin', 'twitter', 'facebook', 'instagram'].map(p => (
                        <Field key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} icon={Globe}>
                          <input type="url" value={form.social_media_links[p]} onChange={e => setSocial(p, e.target.value)} placeholder={`https://${p}.com/yourpage`} />
                        </Field>
                      ))}
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                      {error && <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">{error}</div>}
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2">
                        {[
                          ['Business', form.business_name],
                          ['Industry', form.industry_type],
                          ['Website', form.website_url],
                          ['Email', form.email],
                          ['Location', form.business_location],
                          ['Audience', form.target_audience],
                        ].map(([k, v]) => v ? (
                          <div key={k} className="flex items-start gap-2 text-xs">
                            <span className="text-slate-400 w-20 shrink-0">{k}:</span>
                            <span className="font-medium text-slate-800 truncate">{v}</span>
                          </div>
                        ) : null)}
                      </div>
                      <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
                        <ScoreRing score={liveScore()} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">Estimated Score</p>
                          <p className="text-xs text-slate-500 mt-0.5">Based on provided information</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100">
                <button onClick={() => step === 0 ? setShowWizard(false) : setStep(s => s - 1)}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                  <ChevronLeft className="h-4 w-4" /> {step === 0 ? 'Cancel' : 'Back'}
                </button>
                {step < 3 ? (
                  <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && !form.business_name}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all">
                    {submitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="h-4 w-4" /> Analyze Business</>}
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BusinessProfile;

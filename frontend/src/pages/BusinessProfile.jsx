import { useState, useEffect, cloneElement, Fragment } from 'react';
import { businessAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Check, AlertTriangle, Globe, Phone, Mail,
  Edit2, Save, TrendingUp, Calendar, Loader, Building2, Link2, Download, Printer,
  Briefcase, MapPin, Users, Sparkles, ChevronRight, ChevronLeft
} from 'lucide-react';
import { generatePDF, printReport } from '../utils/pdfGenerator';

const STEPS = ['Business Info', 'Contact & Location', 'Social & Google', 'Branches & Review'];

/* ─── SVG brand icons ─── */
const FbIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IgIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const LiIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);
const YtIcon = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
    <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
  </svg>
);

const socialMeta = {
  facebook:  { label: 'Facebook',  Icon: FbIcon, color: 'text-[#1877F2] bg-blue-50 border-blue-100 hover:bg-blue-100' },
  instagram: { label: 'Instagram', Icon: IgIcon, color: 'text-[#E4405F] bg-pink-50 border-pink-100 hover:bg-pink-100' },
  linkedin:  { label: 'LinkedIn',  Icon: LiIcon, color: 'text-[#0A66C2] bg-sky-50 border-sky-100 hover:bg-sky-100' },
  youtube:   { label: 'YouTube',   Icon: YtIcon, color: 'text-[#FF0000] bg-red-50 border-red-100 hover:bg-red-100' },
  twitter:   { label: 'Twitter',   Icon: Globe,  color: 'text-slate-700 bg-slate-50 border-slate-200 hover:bg-slate-100' }
};

const ScoreRing = ({ score }) => {
  const r = 40, c = 2 * Math.PI * r;
  const color = score >= 80 ? '#10B981' : score >= 50 ? '#F59E0B' : '#8B5CF6';
  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: 100, height: 100 }}>
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
        done ? 'bg-emerald-500 border-emerald-500 text-white' :
        active ? 'border-white text-white bg-white/20' :
        'border-white/30 text-white/60 bg-transparent'
      }`}>
        {done ? <Check className="h-4 w-4" /> : step + 1}
      </div>
      <span className={`text-[10px] font-semibold hidden sm:block ${active ? 'text-white' : 'text-white/60'}`}>{label}</span>
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
      {cloneElement(children, {
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
    business_name: '', business_category: '', industry_type: '', website_url: '', description: '',
    business_address: '', city: '', state: '', country: 'India', pincode: '',
    google_profile_registered: 'No', google_maps_link: '',
    number_of_branches: '', branch_locations: '',
    contact_number: '', email: '', whatsapp_number: '',
    target_audience: '',
    social_media_links: { linkedin: '', twitter: '', facebook: '', instagram: '', youtube: '' }
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
    const fields = [
      form.business_name, form.industry_type, form.website_url, form.description,
      form.business_address, form.city, form.state, form.pincode,
      form.google_profile_registered, form.google_maps_link, form.number_of_branches,
      form.contact_number, form.email, form.whatsapp_number, form.target_audience,
      form.social_media_links.linkedin, form.social_media_links.twitter,
      form.social_media_links.facebook, form.social_media_links.instagram, form.social_media_links.youtube
    ];
    const filled = fields.filter(Boolean).length;
    return Math.round((filled / fields.length) * 100);
  };

  const openWizard = () => {
    setForm({
      business_name: '', business_category: '', industry_type: '', website_url: '', description: '',
      business_address: '', city: '', state: '', country: 'India', pincode: '',
      google_profile_registered: 'No', google_maps_link: '',
      number_of_branches: '', branch_locations: '',
      contact_number: '', email: '', whatsapp_number: '',
      target_audience: '',
      social_media_links: { linkedin: '', twitter: '', facebook: '', instagram: '', youtube: '' }
    });
    setStep(0); setError(''); setEditMode(false); setShowWizard(true);
  };

  const handleSubmit = async () => {
    setError(''); setSubmitting(true);
    try {
      // Format full location string
      let finalLocation = '';
      if (form.business_address || form.city || form.state || form.pincode) {
        finalLocation = [form.business_address, form.city, form.state, form.country].filter(Boolean).join(', ');
        if (form.pincode) finalLocation += ` - ${form.pincode}`;
      } else {
        finalLocation = form.country || 'India';
      }

      const payload = {
        ...form,
        business_location: finalLocation,
        number_of_branches: form.number_of_branches ? parseInt(form.number_of_branches) : 0
      };

      const profile = await businessAPI.createProfile(payload);
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
      business_category: profile.business_category || '',
      industry_type: profile.industry_type || '',
      website_url: profile.website_url || '',
      description: profile.description || '',
      business_address: profile.business_address || '',
      city: profile.city || '',
      state: profile.state || '',
      country: profile.country || 'India',
      pincode: profile.pincode || '',
      google_profile_registered: profile.google_profile_registered || 'No',
      google_maps_link: profile.google_maps_link || '',
      number_of_branches: profile.number_of_branches || 0,
      branch_locations: profile.branch_locations || '',
      contact_number: profile.contact_number || '',
      email: profile.email || '',
      whatsapp_number: profile.whatsapp_number || '',
      target_audience: profile.target_audience || '',
      social_media_links: {
        linkedin: profile.social_media_links?.linkedin || '',
        twitter: profile.social_media_links?.twitter || '',
        facebook: profile.social_media_links?.facebook || '',
        instagram: profile.social_media_links?.instagram || '',
        youtube: profile.social_media_links?.youtube || ''
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
      // Format full location string
      let finalLocation = '';
      if (editForm.business_address || editForm.city || editForm.state || editForm.pincode) {
        finalLocation = [editForm.business_address, editForm.city, editForm.state, editForm.country].filter(Boolean).join(', ');
        if (editForm.pincode) finalLocation += ` - ${editForm.pincode}`;
      } else {
        finalLocation = editForm.country || 'India';
      }

      const payload = {
        ...editForm,
        business_location: finalLocation,
        number_of_branches: editForm.number_of_branches ? parseInt(editForm.number_of_branches) : 0
      };

      const updated = await businessAPI.updateProfile(selected.id, payload);
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
          <h1 className="text-2xl font-extrabold text-slate-800">Business Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Configure and inspect business profile details, locations, and social links</p>
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

                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
                  {/* Business Information Section */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Briefcase className="h-4 w-4 text-violet-500" /> Business Details</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Business Name" icon={Briefcase} required>
                        <input type="text" value={editForm.business_name} onChange={e => setEditField('business_name', e.target.value)} />
                      </Field>
                      <Field label="Business Category">
                        <select value={editForm.business_category} onChange={e => setEditField('business_category', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none">
                          <option value="">Select Category</option>
                          <option value="SaaS / Technology">SaaS / Technology</option>
                          <option value="E-commerce / Retail">E-commerce / Retail</option>
                          <option value="Professional Services">Professional Services</option>
                          <option value="Healthcare / Wellness">Healthcare / Wellness</option>
                          <option value="Real Estate">Real Estate</option>
                          <option value="Food & Beverage">Food & Beverage</option>
                          <option value="Education">Education</option>
                          <option value="Other">Other</option>
                        </select>
                      </Field>
                      <Field label="Industry Type" required>
                        <select value={editForm.industry_type} onChange={e => setEditField('industry_type', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none">
                          <option value="">Select Industry Type</option>
                          <option value="B2B">B2B</option>
                          <option value="B2C">B2C</option>
                          <option value="D2C">D2C</option>
                          <option value="Local Service">Local Service</option>
                          <option value="Other">Other</option>
                        </select>
                      </Field>
                      <Field label="Website URL" icon={Globe}>
                        <input type="url" value={editForm.website_url} onChange={e => setEditField('website_url', e.target.value)} />
                      </Field>
                      <div className="sm:col-span-2">
                        <Field label="Target Audience" icon={Users}>
                          <input type="text" value={editForm.target_audience} onChange={e => setEditField('target_audience', e.target.value)} />
                        </Field>
                      </div>
                      <div className="sm:col-span-2">
                        <Field label="Business Description">
                          <textarea rows={3} value={editForm.description} onChange={e => setEditField('description', e.target.value)} className="resize-none" />
                        </Field>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Section */}
                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Mail className="h-4 w-4 text-violet-500" /> Contact Details</h4>
                    <div className="grid sm:grid-cols-3 gap-4">
                      <Field label="Email" icon={Mail}>
                        <input type="email" value={editForm.email} onChange={e => setEditField('email', e.target.value)} />
                      </Field>
                      <Field label="Contact Phone" icon={Phone}>
                        <input type="tel" value={editForm.contact_number} onChange={e => setEditField('contact_number', e.target.value)} />
                      </Field>
                      <Field label="WhatsApp Number" icon={Phone}>
                        <input type="tel" value={editForm.whatsapp_number} onChange={e => setEditField('whatsapp_number', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  {/* Location Details Section */}
                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><MapPin className="h-4 w-4 text-violet-500" /> Business Location</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Street Address" icon={MapPin}>
                          <input type="text" value={editForm.business_address} onChange={e => setEditField('business_address', e.target.value)} />
                        </Field>
                      </div>
                      <Field label="City">
                        <input type="text" value={editForm.city} onChange={e => setEditField('city', e.target.value)} />
                      </Field>
                      <Field label="State">
                        <input type="text" value={editForm.state} onChange={e => setEditField('state', e.target.value)} />
                      </Field>
                      <Field label="Country">
                        <input type="text" value={editForm.country} onChange={e => setEditField('country', e.target.value)} />
                      </Field>
                      <Field label="Pincode">
                        <input type="text" value={editForm.pincode} onChange={e => setEditField('pincode', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  {/* Google Profile Status Section */}
                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Globe className="h-4 w-4 text-violet-500" /> Google Business Details</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Google Profile Registered?</label>
                        <div className="flex gap-4 items-center h-[42px]">
                          {['Yes', 'No'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="radio" 
                                name="googleProfileEdit" 
                                value={opt} 
                                checked={editForm.google_profile_registered === opt}
                                onChange={() => setEditField('google_profile_registered', opt)}
                                className="text-violet-600 focus:ring-violet-400"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <Field label="Google Maps Location Link" icon={Link2}>
                        <input type="url" value={editForm.google_maps_link} onChange={e => setEditField('google_maps_link', e.target.value)} />
                      </Field>
                    </div>
                  </div>

                  {/* Branches Section */}
                  <div className="border-t border-slate-100 pt-6">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Building2 className="h-4 w-4 text-violet-500" /> Branches & Scale</h4>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Number of Branches">
                        <input type="number" min="0" value={editForm.number_of_branches} onChange={e => setEditField('number_of_branches', e.target.value)} />
                      </Field>
                      <Field label="Branch Locations">
                        <input type="text" value={editForm.branch_locations} onChange={e => setEditField('branch_locations', e.target.value)} placeholder="Mumbai, Delhi, Bangalore" />
                      </Field>
                    </div>
                  </div>

                  {/* Social Links Section */}
                  <div className="border-t border-slate-100 pt-6">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Social Media Links</p>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {['linkedin', 'twitter', 'facebook', 'instagram', 'youtube'].map(p => (
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
                        <div className="flex gap-2">
                          <button onClick={() => generatePDF(selected, 'Business Profile')} className="flex items-center gap-1.5 text-xs text-white bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl px-3 py-1.5 hover:opacity-90 transition-all shadow-sm">
                            <Download className="h-3 w-3" /> Download PDF
                          </button>
                          <button onClick={() => printReport(selected, 'Business Profile')} className="flex items-center gap-1.5 text-xs text-slate-600 border border-slate-200 rounded-xl px-3 py-1.5 hover:bg-slate-50 transition-all hidden sm:flex">
                            <Printer className="h-3 w-3" /> Print
                          </button>
                          <button onClick={() => startEditMode(selected)}
                            className="flex items-center gap-1.5 text-xs text-violet-600 border border-violet-200 rounded-xl px-3.5 py-1.5 hover:bg-violet-50 transition-all font-semibold shadow-sm bg-white">
                            <Edit2 className="h-3.5 w-3.5" /> Edit Profile
                          </button>
                        </div>
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

                {/* Main Profile Info Grid */}
                <div className="grid sm:grid-cols-2 gap-4">
                  
                  {/* Business Details Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
                      <Briefcase className="h-4 w-4 text-violet-500" /> Business details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Category:</span>
                        <span className="font-semibold text-slate-800">{selected.business_category || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Industry Type:</span>
                        <span className="font-semibold text-slate-800">{selected.industry_type || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Website URL:</span>
                        {selected.website_url ? (
                          <a href={selected.website_url} target="_blank" rel="noreferrer" className="font-semibold text-violet-600 hover:underline truncate max-w-[150px]">{selected.website_url}</a>
                        ) : (
                          <span className="text-slate-400">Not specified</span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Target Audience:</span>
                        <span className="font-semibold text-slate-800 truncate max-w-[150px]">{selected.target_audience || 'Not specified'}</span>
                      </div>
                      <div className="text-xs pt-1 border-t border-slate-50 mt-1">
                        <span className="text-slate-400 block mb-1">Description:</span>
                        <p className="text-slate-600 bg-slate-50 rounded-xl p-2.5 leading-relaxed text-[11px] max-h-24 overflow-y-auto">{selected.description || 'No description added yet.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact Info Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
                      <Mail className="h-4 w-4 text-violet-500" /> Contact details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Business Email:</span>
                        <span className="font-semibold text-slate-800">{selected.email || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Contact Number:</span>
                        <span className="font-semibold text-slate-800">{selected.contact_number || 'Not specified'}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">WhatsApp Business:</span>
                        <span className="font-semibold text-slate-800">{selected.whatsapp_number || 'Not specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Google Profile Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
                      <Globe className="h-4 w-4 text-violet-500" /> Google Business Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Profile Registered:</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${selected.google_profile_registered === 'Yes' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                          {selected.google_profile_registered || 'No'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Maps Link:</span>
                        {selected.google_maps_link ? (
                          <a href={selected.google_maps_link} target="_blank" rel="noreferrer" className="font-semibold text-violet-600 hover:underline flex items-center gap-1"><Link2 className="h-3 w-3" /> View Maps Link</a>
                        ) : (
                          <span className="text-slate-400">Not specified</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branches & Scale Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
                      <Building2 className="h-4 w-4 text-violet-500" /> Branches & Scale
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">Number of Branches:</span>
                        <span className="font-semibold text-slate-800">{selected.number_of_branches || 0}</span>
                      </div>
                      <div className="text-xs pt-1 border-t border-slate-50 mt-1">
                        <span className="text-slate-400 block mb-1">Branch Locations:</span>
                        <p className="text-slate-600 bg-slate-50 rounded-xl p-2.5 leading-relaxed text-[11px] max-h-24 overflow-y-auto">{selected.branch_locations || 'No other branch locations listed.'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Physical Location Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4 sm:col-span-2">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-50">
                      <MapPin className="h-4 w-4 text-violet-500" /> Physical Location Details
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Street Address:</span>
                          <span className="font-semibold text-slate-800 text-right max-w-[180px] truncate">{selected.business_address || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">City:</span>
                          <span className="font-semibold text-slate-800">{selected.city || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">State:</span>
                          <span className="font-semibold text-slate-800">{selected.state || 'Not specified'}</span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Country:</span>
                          <span className="font-semibold text-slate-800">{selected.country || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Pincode:</span>
                          <span className="font-semibold text-slate-800">{selected.pincode || 'Not specified'}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-400">Full Address String:</span>
                          <span className="font-semibold text-slate-800 text-right max-w-[150px] truncate" title={selected.business_location}>{selected.business_location || 'Not specified'}</span>
                        </div>
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

                  {/* Social Channels Card */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3">
                      <Users className="h-4 w-4 text-violet-500" /> Social Channels
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selected.social_media_links || {}).map(([platform, url]) => {
                        if (!url) return null;
                        const meta = socialMeta[platform] || socialMeta.twitter;
                        const MetaIcon = meta.Icon;
                        return (
                          <a key={platform} href={url} target="_blank" rel="noreferrer"
                            className={`flex items-center gap-1.5 text-xs font-semibold border rounded-xl px-3 py-1.5 transition-all ${meta.color}`}>
                            <MetaIcon className="h-3.5 w-3.5 shrink-0" />
                            {meta.label}
                          </a>
                        );
                      })}
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden">

              {/* Wizard Header */}
              <div className="bg-gradient-to-r from-violet-600 to-indigo-600 p-6 text-white">
                <h2 className="text-lg font-extrabold mb-4">New Business Profile</h2>
                <div className="flex items-center gap-2">
                  {STEPS.map((label, i) => (
                    <Fragment key={label}>
                      <StepDot step={i} current={step} label={label} />
                      {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded-full transition-all ${step > i ? 'bg-white' : 'bg-white/25'}`} />}
                    </Fragment>
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
              <div className="px-6 pb-4 max-h-[50vh] overflow-y-auto">
                <AnimatePresence mode="wait">
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Business Name" icon={Briefcase} required>
                          <input type="text" value={form.business_name} onChange={e => set('business_name', e.target.value)} placeholder="Acme Agency" />
                        </Field>
                        <Field label="Business Category">
                          <select value={form.business_category} onChange={e => set('business_category', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:bg-white transition-all">
                            <option value="">Select Category</option>
                            <option value="SaaS / Technology">SaaS / Technology</option>
                            <option value="E-commerce / Retail">E-commerce / Retail</option>
                            <option value="Professional Services">Professional Services</option>
                            <option value="Healthcare / Wellness">Healthcare / Wellness</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Food & Beverage">Food & Beverage</option>
                            <option value="Education">Education</option>
                            <option value="Other">Other</option>
                          </select>
                        </Field>
                      </div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Industry Type" required>
                          <select value={form.industry_type} onChange={e => set('industry_type', e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:bg-white transition-all">
                            <option value="">Select Industry Type</option>
                            <option value="B2B">B2B</option>
                            <option value="B2C">B2C</option>
                            <option value="D2C">D2C</option>
                            <option value="Local Service">Local Service</option>
                            <option value="Other">Other</option>
                          </select>
                        </Field>
                        <Field label="Website URL" icon={Globe}>
                          <input type="url" value={form.website_url} onChange={e => set('website_url', e.target.value)} placeholder="https://yoursite.com" />
                        </Field>
                      </div>
                      <Field label="Target Audience" icon={Users}>
                        <input type="text" value={form.target_audience} onChange={e => set('target_audience', e.target.value)} placeholder="e.g. B2B SaaS founders, eco-conscious shoppers" />
                      </Field>
                      <Field label="Business Description">
                        <textarea rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Describe your business in detail..." className="resize-none" />
                      </Field>
                    </motion.div>
                  )}
                  {step === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div className="grid sm:grid-cols-3 gap-4">
                        <Field label="Email" icon={Mail}>
                          <input type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@business.com" />
                        </Field>
                        <Field label="Phone" icon={Phone}>
                          <input type="tel" value={form.contact_number} onChange={e => set('contact_number', e.target.value)} placeholder="+1 555 000-0000" />
                        </Field>
                        <Field label="WhatsApp Number" icon={Phone}>
                          <input type="tel" value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+1 555 000-0000" />
                        </Field>
                      </div>
                      <Field label="Street Address" icon={MapPin}>
                        <input type="text" value={form.business_address} onChange={e => set('business_address', e.target.value)} placeholder="123 Growth Blvd, Suite 100" />
                      </Field>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="City">
                          <input type="text" value={form.city} onChange={e => set('city', e.target.value)} placeholder="San Francisco" />
                        </Field>
                        <Field label="State">
                          <input type="text" value={form.state} onChange={e => set('state', e.target.value)} placeholder="CA" />
                        </Field>
                        <Field label="Country">
                          <input type="text" value={form.country} onChange={e => set('country', e.target.value)} placeholder="United States" />
                        </Field>
                        <Field label="Pincode">
                          <input type="text" value={form.pincode} onChange={e => set('pincode', e.target.value)} placeholder="94107" />
                        </Field>
                      </div>
                    </motion.div>
                  )}
                  {step === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      {/* Google Business Profile Status */}
                      <div className="border border-slate-100 rounded-2xl bg-slate-50 p-4">
                        <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Google Business Profile Registered?</label>
                        <div className="flex gap-4 items-center h-[32px] mb-3">
                          {['Yes', 'No'].map(opt => (
                            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                              <input 
                                type="radio" 
                                name="googleProfileWizard" 
                                value={opt} 
                                checked={form.google_profile_registered === opt}
                                onChange={() => set('google_profile_registered', opt)}
                                className="text-violet-600 focus:ring-violet-400"
                              />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                        <Field label="Google Maps Location Link" icon={Link2}>
                          <input type="url" value={form.google_maps_link} onChange={e => set('google_maps_link', e.target.value)} placeholder="https://maps.google.com/..." />
                        </Field>
                      </div>
                      
                      {/* Social media Links */}
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Social Media URLs</label>
                        <div className="space-y-3">
                          {['facebook', 'instagram', 'linkedin', 'youtube', 'twitter'].map(p => (
                            <Field key={p} label={p.charAt(0).toUpperCase() + p.slice(1)} icon={Globe}>
                              <input type="url" value={form.social_media_links[p]} onChange={e => setSocial(p, e.target.value)} placeholder={`https://${p}.com/yourpage`} />
                            </Field>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {step === 3 && (
                    <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="Number of Branches">
                          <input type="number" min="0" value={form.number_of_branches} onChange={e => set('number_of_branches', e.target.value)} placeholder="e.g. 1" />
                        </Field>
                        <Field label="Branch Locations">
                          <input type="text" value={form.branch_locations} onChange={e => set('branch_locations', e.target.value)} placeholder="Mumbai, Bangalore" />
                        </Field>
                      </div>

                      {error && <div className="rounded-xl bg-red-50 border border-red-100 p-3 text-xs text-red-600">{error}</div>}
                      
                      <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4 space-y-2 max-h-40 overflow-y-auto">
                        {[
                          ['Business', form.business_name],
                          ['Category', form.business_category],
                          ['Industry', form.industry_type],
                          ['Website', form.website_url],
                          ['Email', form.email],
                          ['Address', form.business_address],
                          ['Google GBP', form.google_profile_registered],
                          ['Branches', form.number_of_branches],
                        ].map(([k, v]) => v ? (
                          <div key={k} className="flex items-start gap-2 text-xs">
                            <span className="text-slate-400 w-24 shrink-0">{k}:</span>
                            <span className="font-medium text-slate-800 truncate">{v}</span>
                          </div>
                        ) : null)}
                      </div>
                      <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100">
                        <ScoreRing score={liveScore()} />
                        <div>
                          <p className="text-sm font-bold text-slate-800">Estimated Completeness Score</p>
                          <p className="text-xs text-slate-500 mt-0.5">Based on provided profile data</p>
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
                  <button onClick={() => setStep(s => s + 1)} disabled={step === 0 && (!form.business_name || !form.industry_type)}
                    className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all">
                    Next <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button onClick={handleSubmit} disabled={submitting}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50 transition-all">
                    {submitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Sparkles className="h-4 w-4" /> Create Profile</>}
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

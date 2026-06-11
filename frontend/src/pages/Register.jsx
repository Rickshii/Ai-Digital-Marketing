import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { businessAPI } from '../services/api';
import { motion } from 'framer-motion';
import {
  Sparkles, Mail, Lock, User, Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle,
  Building2, MapPin, Globe, Phone, FileText, Link2, Info
} from 'lucide-react';

/* ─── SVG brand icons matching SocialMedia.jsx ─── */
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

const sidebarContent = {
  1: {
    title: 'Create Your Professional Account',
    subtitle: 'Join 500+ businesses using AI to dominate their market. Free to start.',
    perks: [
      'AI Marketing Strategy Generator',
      'Website & SEO Auditing Engine',
      'Social Media Performance Tracker',
      'Monthly Growth Reports & Analytics',
    ],
    quote: '"MarketerAI transformed our SEO strategy in just 2 weeks!"',
    author: '— Sarah K., Growth Manager at TechFlow'
  },
  2: {
    title: 'Tell Us About Your Business',
    subtitle: 'Providing detailed business information enables our AI to generate highly customized strategies.',
    perks: [
      'Industry-Specific Analysis',
      'Competitor Benchmarking',
      'Target Audience Profiling',
      'Localized SEO Recommendations',
    ],
    quote: '"The AI strategy matched our target audience perfectly once we added our business details."',
    author: '— David L., Founder at Bloom Floral'
  },
  3: {
    title: 'Amplify Your Social Reach',
    subtitle: 'Connect your social media pages for continuous tracking and optimization suggestions.',
    perks: [
      'Real-time Reach Metrics',
      'Engagement Rate Analysis',
      'Posting Frequency Audits',
      'Competitor Sentiment Tracking',
    ],
    quote: '"Automated social auditing saved us 15 hours of manual reporting every month."',
    author: '— Marcus T., Social Lead at AeroDine'
  }
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  
  // Current Step (1, 2, or 3)
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 State: Account Information
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Step 2 State: Business Information
  const [businessName, setBusinessName] = useState('');
  const [businessCategory, setBusinessCategory] = useState('');
  const [industryType, setIndustryType] = useState('');
  const [description, setDescription] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');
  const [googleProfileRegistered, setGoogleProfileRegistered] = useState('No');
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [numberOfBranches, setNumberOfBranches] = useState('');
  const [branchLocations, setBranchLocations] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // Step 3 State: Social Media Information
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  // Password Strength Calculator
  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;

  // Step 1 Validation
  const validateStep1 = () => {
    if (!fullName.trim()) return 'Full name is required.';
    if (!email.trim()) return 'Work email is required.';
    if (!/\S+@\S+\.\S+/.test(email)) return 'Please enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    if (password !== confirmPassword) return 'Passwords do not match.';
    return null;
  };

  // Step 2 Validation
  const validateStep2 = () => {
    if (!businessName.trim()) return 'Business name is required.';
    if (!industryType.trim()) return 'Industry type is required.';
    return null;
  };

  const handleNextStep = () => {
    setError('');
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setStep(2);
    } else if (step === 2) {
      const err = validateStep2();
      if (err) { setError(err); return; }
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    setError('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const errStep1 = validateStep1();
    if (errStep1) { setStep(1); setError(errStep1); return; }

    const errStep2 = validateStep2();
    if (errStep2) { setStep(2); setError(errStep2); return; }

    setLoading(true);
    try {
      // 1. Create user account (which also logs the user in)
      await register(email, fullName, password);

      // 2. Format business location
      let finalLocation = '';
      if (businessAddress || city || state || pincode) {
        finalLocation = [businessAddress, city, state, country].filter(Boolean).join(', ');
        if (pincode) finalLocation += ` - ${pincode}`;
      } else {
        finalLocation = country || 'Global';
      }

      // 3. Prepare business details payload
      const businessData = {
        business_name: businessName,
        business_category: businessCategory || 'Other',
        industry_type: industryType,
        description: description || '',
        business_location: finalLocation,
        website_url: websiteUrl || null,
        contact_number: contactNumber || null,
        email: businessEmail || email,
        target_audience: 'General Market',
        
        // Extended model fields
        business_address: businessAddress || '',
        city: city || '',
        state: state || '',
        country: country || 'India',
        pincode: pincode || '',
        google_profile_registered: googleProfileRegistered,
        google_maps_link: googleMapsLink || '',
        number_of_branches: numberOfBranches ? parseInt(numberOfBranches) : 0,
        branch_locations: branchLocations || '',
        whatsapp_number: whatsappNumber || '',
        
        // Social media links object
        social_media_links: {
          facebook: facebookUrl || '',
          instagram: instagramUrl || '',
          linkedin: linkedinUrl || '',
          youtube: youtubeUrl || ''
        }
      };

      // 4. Save business details in database (PostgreSQL/SQLite)
      await businessAPI.createProfile(businessData);

      // 5. Redirect to Dashboard
      navigate('/');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentSidebar = sidebarContent[step] || sidebarContent[1];

  const renderProgressBar = () => {
    const steps = [
      { number: 1, label: 'Account' },
      { number: 2, label: 'Business' },
      { number: 3, label: 'Social' }
    ];

    return (
      <div className="mb-8 flex items-center justify-between">
        {steps.map((s, idx) => (
          <React.Fragment key={s.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center relative z-10">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full border-2 font-bold transition-all duration-300 ${
                step > s.number 
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                  : step === s.number
                    ? 'bg-violet-600 border-violet-600 text-white shadow-lg shadow-violet-600/20'
                    : 'bg-white border-slate-200 text-slate-400'
              }`}>
                {step > s.number ? <CheckCircle className="h-5 w-5 stroke-[3]" /> : s.number}
              </div>
              <span className={`text-[10px] font-bold mt-2 uppercase tracking-wider transition-colors duration-300 ${
                step === s.number ? 'text-violet-600' : 'text-slate-400'
              }`}>
                {s.label}
              </span>
            </div>
            
            {/* Connector Line */}
            {idx < steps.length - 1 && (
              <div className="flex-1 h-0.5 mx-2 bg-slate-100 relative -top-3">
                <div className="h-full bg-gradient-to-r from-violet-600 to-indigo-600 transition-all duration-500" 
                  style={{ width: step > s.number ? '100%' : '0%' }}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex">
      {/* Dynamic Left Sidebar */}
      <motion.div
        initial={{ opacity: 0, x: -30 }} 
        animate={{ opacity: 1, x: 0 }} 
        transition={{ duration: 0.5 }}
        className="hidden lg:flex lg:w-5/12 bg-gradient-to-br from-indigo-600 via-violet-700 to-purple-800 relative flex-col justify-between p-12 overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-20 -left-20 h-72 w-72 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 border border-white/20">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <span className="text-white text-xl font-bold">MarketerAI</span>
        </div>

        {/* Dynamic Sidebar Content based on Active Step */}
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="relative z-10 my-auto py-8"
        >
          <h2 className="text-3xl font-extrabold text-white leading-tight mb-4">
            {currentSidebar.title}
          </h2>
          <p className="text-violet-200 text-sm leading-relaxed mb-8 max-w-md">
            {currentSidebar.subtitle}
          </p>
          <div className="space-y-4">
            {currentSidebar.perks.map((perk, i) => (
              <div key={i} className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
                <span className="text-violet-100 text-sm font-medium">{perk}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div 
          key={`quote-${step}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 rounded-2xl bg-white/10 border border-white/15 p-5 backdrop-blur-sm"
        >
          <p className="text-white text-xs font-medium italic leading-relaxed">{currentSidebar.quote}</p>
          <p className="text-violet-300 text-[10px] mt-2 font-semibold tracking-wider uppercase">{currentSidebar.author}</p>
        </motion.div>
      </motion.div>

      {/* Main Form Area */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 overflow-y-auto">
        <motion.div 
          animate={{ maxWidth: step === 2 ? '42rem' : '28rem' }}
          transition={{ duration: 0.3 }}
          className="w-full"
        >
          {/* Logo for mobile view */}
          <div className="flex items-center justify-center gap-2 mb-6 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-slate-800 text-xl font-bold">MarketerAI</span>
          </div>

          {/* Form Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-slate-800">
              {step === 1 && 'Create your account'}
              {step === 2 && 'Tell us about your business'}
              {step === 3 && 'Connect social media'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {step === 1 && 'Get started free — no credit card required'}
              {step === 2 && 'Fill details to generate personalized AI campaigns'}
              {step === 3 && 'Let our AI inspect and audit your social presence'}
            </p>
          </div>

          {/* Step Progress Bar */}
          {renderProgressBar()}

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-medium text-red-600 flex items-center gap-2"
            >
              <Info className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Registration Form */}
          <form onSubmit={step === 3 ? handleSubmit : (e) => e.preventDefault()} className="space-y-6">
            
            {/* STEP 1: Account Information */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      required 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      placeholder="Sarah Jenkins"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Work Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      required 
                      value={email} 
                      onChange={e => setEmail(e.target.value)} 
                      placeholder="you@company.com"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type={showPass ? 'text' : 'password'} 
                        required 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type={showConfirmPass ? 'text' : 'password'} 
                        required 
                        value={confirmPassword} 
                        onChange={e => setConfirmPassword(e.target.value)} 
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-10 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                      <button type="button" onClick={() => setShowConfirmPass(p => !p)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                        {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4].map(n => (
                        <div key={n} className={`flex-1 h-1 rounded-full transition-all ${strength >= n ? (strength <= 1 ? 'bg-red-400' : strength <= 2 ? 'bg-amber-400' : 'bg-emerald-400') : 'bg-slate-200'}`} />
                      ))}
                      <span className="ml-2 text-xs text-slate-400 font-semibold">{['', 'Weak', 'Fair', 'Good', 'Strong'][strength]}</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 pt-2">
                  <input type="checkbox" required className="mt-1 rounded border-slate-300 text-violet-500 focus:ring-violet-400" />
                  <span className="text-xs text-slate-500 leading-normal">
                    I agree to the <span className="text-violet-600 font-bold hover:underline cursor-pointer">Terms of Service</span> and <span className="text-violet-600 font-bold hover:underline cursor-pointer">Privacy Policy</span>.
                  </span>
                </div>
              </motion.div>
            )}

            {/* STEP 2: Business Information */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-5"
              >
                {/* 2-Column Responsive Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Business Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Business Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        required 
                        value={businessName} 
                        onChange={e => setBusinessName(e.target.value)} 
                        placeholder="Acme Corporation"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* Business Category */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Business Category</label>
                    <select 
                      value={businessCategory} 
                      onChange={e => setBusinessCategory(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    >
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
                  </div>

                  {/* Industry Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Industry Type *</label>
                    <select 
                      value={industryType} 
                      onChange={e => setIndustryType(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all"
                    >
                      <option value="">Select Industry Type</option>
                      <option value="B2B">B2B</option>
                      <option value="B2C">B2C</option>
                      <option value="D2C">D2C</option>
                      <option value="Local Service">Local Service</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Official Website URL */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Official Website URL</label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="url" 
                        value={websiteUrl} 
                        onChange={e => setWebsiteUrl(e.target.value)} 
                        placeholder="https://acme.com"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* Contact Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Contact Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={contactNumber} 
                        onChange={e => setContactNumber(e.target.value)} 
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* Business Email */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Business Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="email" 
                        value={businessEmail} 
                        onChange={e => setBusinessEmail(e.target.value)} 
                        placeholder="support@acme.com"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* WhatsApp Business Number */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">WhatsApp Business Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="tel" 
                        value={whatsappNumber} 
                        onChange={e => setWhatsappNumber(e.target.value)} 
                        placeholder="+91 98765 43210"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* Google Profile Registered */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Google Business Profile Registered?</label>
                    <div className="flex gap-4 items-center h-[42px]">
                      {['Yes', 'No'].map(opt => (
                        <label key={opt} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                          <input 
                            type="radio" 
                            name="googleProfile" 
                            value={opt} 
                            checked={googleProfileRegistered === opt}
                            onChange={() => setGoogleProfileRegistered(opt)}
                            className="text-violet-600 focus:ring-violet-400"
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Google Maps Location Link */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Google Maps Location Link</label>
                    <div className="relative">
                      <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="url" 
                        value={googleMapsLink} 
                        onChange={e => setGoogleMapsLink(e.target.value)} 
                        placeholder="https://maps.google.com/..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  {/* Address Fields */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Business Address</label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input 
                        type="text" 
                        value={businessAddress} 
                        onChange={e => setBusinessAddress(e.target.value)} 
                        placeholder="123 Growth Boulevard, Suite 400"
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">City</label>
                    <input 
                      type="text" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                      placeholder="Mumbai"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">State</label>
                    <input 
                      type="text" 
                      value={state} 
                      onChange={e => setState(e.target.value)} 
                      placeholder="Maharashtra"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Country</label>
                    <input 
                      type="text" 
                      value={country} 
                      onChange={e => setCountry(e.target.value)} 
                      placeholder="India"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Pincode</label>
                    <input 
                      type="text" 
                      value={pincode} 
                      onChange={e => setPincode(e.target.value)} 
                      placeholder="400001"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>

                  {/* Branches */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Number of Branches</label>
                    <input 
                      type="number" 
                      min="0"
                      value={numberOfBranches} 
                      onChange={e => setNumberOfBranches(e.target.value)} 
                      placeholder="e.g. 2"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Branch Locations</label>
                    <input 
                      type="text" 
                      value={branchLocations} 
                      onChange={e => setBranchLocations(e.target.value)} 
                      placeholder="e.g. Mumbai, Delhi, Bangalore"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Business Description</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <textarea 
                        rows="3"
                        value={description} 
                        onChange={e => setDescription(e.target.value)} 
                        placeholder="Briefly describe what your business sells, who your customers are, and your main selling points..."
                        className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all resize-none" 
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: Social Media Information */}
            {step === 3 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <FbIcon className="h-4 w-4 text-[#1877F2] fill-current" /> Facebook Page URL
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="url" 
                      value={facebookUrl} 
                      onChange={e => setFacebookUrl(e.target.value)} 
                      placeholder="https://facebook.com/yourpage"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <IgIcon className="h-4 w-4 text-[#E4405F]" /> Instagram Handle URL
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="url" 
                      value={instagramUrl} 
                      onChange={e => setInstagramUrl(e.target.value)} 
                      placeholder="https://instagram.com/yourhandle"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <LiIcon className="h-4 w-4 text-[#0A66C2] fill-current" /> LinkedIn Company URL
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="url" 
                      value={linkedinUrl} 
                      onChange={e => setLinkedinUrl(e.target.value)} 
                      placeholder="https://linkedin.com/company/yourcompany"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                    <YtIcon className="h-4 w-4 text-[#FF0000]" /> YouTube Channel URL
                  </label>
                  <div className="relative">
                    <Link2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="url" 
                      value={youtubeUrl} 
                      onChange={e => setYoutubeUrl(e.target.value)} 
                      placeholder="https://youtube.com/c/yourchannel"
                      className="w-full pl-10 pr-4 py-3 text-sm rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" 
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Navigation Controls */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
              {step > 1 ? (
                <button 
                  type="button" 
                  onClick={handlePrevStep}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 shadow-sm hover:bg-slate-50 transition-all"
                >
                  <ArrowLeft className="h-4 w-4" /> Back
                </button>
              ) : (
                <div /> // spacer
              )}

              {step < 3 ? (
                <button 
                  type="button" 
                  onClick={handleNextStep}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:opacity-95 transition-all"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <motion.button 
                  type="submit" 
                  disabled={loading} 
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-500/25 hover:opacity-95 transition-all disabled:opacity-60"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Complete Registration <CheckCircle className="h-4 w-4" /></>
                  )}
                </motion.button>
              )}
            </div>
          </form>

          {/* Direct Link to Login (only on Step 1) */}
          {step === 1 && (
            <p className="text-center text-sm text-slate-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-violet-600 font-bold hover:underline">Sign in</Link>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Register;

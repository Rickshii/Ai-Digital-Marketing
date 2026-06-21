import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, CreditCard, Sparkles, ShieldCheck, Zap, AlertCircle,
  Loader2, Calendar, Clock, RefreshCw
} from 'lucide-react';
import { useToast, ToastContainer } from '../components/Toast';

const POPULAR_PLAN = "1 Month";

const Subscription = () => {
  const { user, accessStatus, refreshAccessStatus } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, removeToast } = useToast();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [refreshingPlans, setRefreshingPlans] = useState(false);
  const [processingPlan, setProcessingPlan] = useState(null); // which plan is being processed
  const [paymentModal, setPaymentModal] = useState({ show: false, plan: null, method: null });
  const [qrFile, setQrFile] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [qrImageUrl, setQrImageUrl] = useState(null);  // dynamic from DB
  const [qrTimestamp, setQrTimestamp] = useState(Date.now()); // cache-buster
  const [detectingTxn, setDetectingTxn] = useState(false);
  const razorpayTriggeredRef = useRef(false); // prevents duplicate Razorpay launches

  const fetchInitialData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshingPlans(true);
    else setLoadingPlans(true);
    try {
      const [plansData, qrData] = await Promise.allSettled([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getQRUrl(),
      ]);

      if (plansData.status === 'fulfilled') {
        const loadedPlans = plansData.value || [];
        console.log(`[Subscription] Plans loaded from DB: ${loadedPlans.length} plans`, loadedPlans);
        setPlans(loadedPlans);
        if (loadedPlans.length === 0) {
          console.warn('[Subscription] WARNING: No plans returned from /subscription/plans — DB may be empty.');
          addToast('No subscription plans found. Admin may need to create plans first.', 'info');
        }
      } else {
        const err = plansData.reason;
        console.error('[Subscription] Failed to load plans:', err?.response?.data || err?.message || err);
        console.error('[Subscription] Error status:', err?.response?.status);
        addToast('Failed to load subscription plans. Please refresh.', 'error');
      }

      if (qrData.status === 'fulfilled' && qrData.value) {
        console.log('[Subscription] QR URL loaded from DB:', qrData.value);
        setQrImageUrl(qrData.value);
        setQrTimestamp(Date.now()); // bust cache on fresh load
      } else {
        console.warn('[Subscription] No QR URL configured — admin has not uploaded a QR code yet.');
        if (qrData.reason) {
          console.error('[Subscription] QR fetch error:', qrData.reason?.response?.data || qrData.reason?.message);
        }
      }
    } catch (err) {
      console.error('[Subscription] Unexpected error fetching initial data:', err);
    } finally {
      setLoadingPlans(false);
      setRefreshingPlans(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      if (document.getElementById('razorpay-sdk')) return resolve(true);
      const script = document.createElement('script');
      script.id = 'razorpay-sdk';
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const openPaymentModal = (plan) => {
    setPaymentModal({ show: true, plan, method: null });
    setQrTimestamp(Date.now()); // force cache-busting on modal open
  };

  const handleQRFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setQrFile(file);
    
    // Automatic OCR detection
    setDetectingTxn(true);
    addToast('Analyzing screenshot for Transaction ID / UTR...', 'info');
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await subscriptionAPI.detectTransaction(formData);
      if (res.success && res.transaction_id) {
        setTransactionId(res.transaction_id);
        addToast(`✅ Detected and autofilled Transaction ID: ${res.transaction_id}`, 'success');
      } else {
        addToast(res.detail || 'Could not auto-detect Transaction ID. Please enter it manually.', 'warning');
      }
    } catch (err) {
      console.error('[OCR] Error detecting transaction ID:', err);
      addToast('Failed to auto-detect Transaction ID. Please enter it manually.', 'warning');
    } finally {
      setDetectingTxn(false);
    }
  };

  const handleQRSubmit = async (e) => {
    e.preventDefault();
    if (!qrFile || !transactionId) {
      addToast('Please upload a payment screenshot and enter the Transaction ID.', 'info');
      return;
    }
    
    setProcessingPlan(paymentModal.plan.plan_name);
    try {
      const formData = new FormData();
      formData.append('plan_name', paymentModal.plan.plan_name);
      formData.append('razorpay_order_id', transactionId); // using this field for UTR
      formData.append('screenshot', qrFile);

      await subscriptionAPI.submitQRPayment(formData);
      addToast('Payment submitted! Your plan will be activated once an admin verifies it.', 'success');
      setPaymentModal({ show: false, plan: null, method: null });
      setQrFile(null);
      setTransactionId('');
    } catch (err) {
      addToast('Failed to submit QR payment: ' + (err.response?.data?.detail || err.message), 'error');
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleRazorpayFlow = async (plan) => {
    setProcessingPlan(plan.plan_name);
    try {
      const orderData = await subscriptionAPI.createOrder(plan.plan_name);

      if (orderData.is_mock) {
        addToast('Test mode: Simulating successful payment...', 'info');
        try {
          const verifyRes = await subscriptionAPI.verifyPayment({
            plan_name: plan.plan_name,
            amount: plan.price,
            duration_days: plan.duration_days,
            razorpay_order_id: orderData.order_id,
            razorpay_payment_id: "mock_payment_" + Date.now(),
            razorpay_signature: "mock_signature",
          });
          if (verifyRes.success) {
            await refreshAccessStatus();
            addToast(`🎉 ${plan.plan_name} plan activated successfully!`, 'success');
            setTimeout(() => navigate('/dashboard'), 1500);
          }
        } catch (err) {
          addToast('Payment verification failed: ' + (err.response?.data?.detail || 'Please contact support.'), 'error');
        }
        return;
      }

      // Live Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        addToast('Payment gateway could not be loaded. Please check your internet connection.', 'error');
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'MarketerAI SaaS',
        description: `${plan.plan_name} Plan — ₹${Number(plan.price).toLocaleString('en-IN')} / ${plan.duration_days} days`,
        order_id: orderData.order_id,
        handler: async (response) => {
          try {
            const verifyRes = await subscriptionAPI.verifyPayment({
              plan_name: plan.plan_name,
              amount: plan.price,
              duration_days: plan.duration_days,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (verifyRes.success) {
              await refreshAccessStatus();
              addToast(`🎉 ${plan.plan_name} plan activated successfully!`, 'success');
              setTimeout(() => navigate('/dashboard'), 1500);
            }
          } catch (err) {
            addToast('Payment verification failed: ' + (err.response?.data?.detail || 'Please contact support.'), 'error');
          }
        },
        prefill: { name: user?.full_name || '', email: user?.email || '' },
        theme: { color: '#7c3aed' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      addToast('Could not create order: ' + (err.response?.data?.detail || 'Server error.'), 'error');
    } finally {
      setProcessingPlan(null);
      setPaymentModal({ show: false, plan: null, method: null });
    }
  };

  const API_BASE = (import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`).replace(/\/api$/, '');

  const buildQRSrc = (url, ts) => {
    if (!url) return null;
    if (url.startsWith('data:')) {
      return url;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      // Absolute URL (Supabase storage, CDN) — append cache-buster as query param
      const sep = url.includes('?') ? '&' : '?';
      return `${url}${sep}v=${ts}`;
    }
    // Relative path — prefix with backend base URL
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${API_BASE}${cleanUrl}?v=${ts}`;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* Active Plan Status Card */}
      {accessStatus && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-3xl p-6 text-white border border-white/10 shadow-lg ${
            !accessStatus.has_access
              ? 'bg-gradient-to-br from-red-500 to-rose-600'
              : accessStatus.subscription_active
              ? 'bg-gradient-to-br from-violet-600 to-indigo-700'
              : 'bg-gradient-to-br from-amber-500 to-orange-500'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {accessStatus.has_access
                ? <ShieldCheck className="h-6 w-6" />
                : <AlertCircle className="h-6 w-6 animate-pulse" />}
              <span className="text-sm font-bold bg-white/20 px-4 py-1.5 rounded-full uppercase tracking-wider">
                {!accessStatus.has_access
                  ? 'Access Expired'
                  : accessStatus.subscription_active
                  ? accessStatus.subscription_plan || 'Active Plan'
                  : `Free Trial`}
              </span>
            </div>
            {accessStatus.trial_active && !accessStatus.subscription_active && (
              <div className="text-right">
                <span className="text-3xl font-extrabold">{accessStatus.trial_days_left}</span>
                <span className="text-sm font-medium opacity-80 block -mt-1">days left</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {accessStatus.subscription_active && accessStatus.subscription_expiry && (
              <>
                <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-4">
                  <Calendar className="h-5 w-5 opacity-80" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mb-0.5">Expiry Date</p>
                    <p className="font-bold text-base">
                      {new Date(accessStatus.subscription_expiry).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-2xl p-4">
                  <Clock className="h-5 w-5 opacity-80" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-70 font-bold mb-0.5">Days Remaining</p>
                    <p className="font-bold text-base">
                      {Math.max(0, Math.ceil(
                        (new Date(accessStatus.subscription_expiry) - new Date()) / (1000 * 60 * 60 * 24)
                      ))} days
                    </p>
                  </div>
                </div>
              </>
            )}
            {accessStatus.trial_active && !accessStatus.subscription_active && (
              <div className="col-span-full flex items-center gap-2 text-amber-50">
                <Zap className="h-4 w-4 text-yellow-300" />
                <span>Your trial started from the account registration date. Upgrade to avoid interruption.</span>
              </div>
            )}
            {!accessStatus.has_access && (
              <div className="col-span-full flex items-center gap-2 text-rose-50">
                <AlertCircle className="h-4 w-4" />
                <span>Your free trial has ended. Choose a plan below to restore full access.</span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Hero */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="inline-block bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Unlock Premium Marketing Intelligence
        </h1>
        <p className="text-slate-500 text-sm leading-relaxed">
          Every plan includes full access to SEO auditing, AI strategy generation, social media analytics, and downloadable PDF reports.
        </p>
        <button
          onClick={() => fetchInitialData(true)}
          disabled={refreshingPlans}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-600 transition-colors mt-1 disabled:opacity-50"
          title="Refresh plans from database"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshingPlans ? 'animate-spin' : ''}`} />
          {refreshingPlans ? 'Refreshing...' : 'Refresh Plans'}
        </button>
      </div>

      {/* Plans Grid */}
      {loadingPlans ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
          <p className="text-slate-400 text-sm animate-pulse">Loading subscription plans...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {plans.map((plan, index) => {
              const isPopular = plan.plan_name === POPULAR_PLAN;
              const isActive = accessStatus?.subscription_active && accessStatus?.subscription_plan === plan.plan_name;
              const isProcessing = processingPlan === plan.plan_name;
              const features = [
                "Full Platform Access",
                "Website & SEO Auditing",
                "Marketing Strategy Generator",
                "PDF Report Downloads",
              ];

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className={`relative flex flex-col bg-white rounded-3xl p-6 border transition-all ${
                    isPopular
                      ? 'border-violet-400 shadow-xl ring-2 ring-violet-500/10'
                      : 'border-slate-100 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isPopular && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow">
                      Most Popular
                    </span>
                  )}

                  {/* Plan header */}
                  <div className="space-y-1 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{plan.duration_days} Days Access</span>
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-800">{plan.plan_name} Plan</h3>
                    {plan.description && (
                      <p className="text-slate-400 text-xs leading-relaxed">{plan.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-1 py-3 border-t border-b border-slate-50 mb-4">
                    <span className="text-3xl font-black text-slate-800">₹{plan.price.toLocaleString('en-IN')}</span>
                    <span className="text-slate-400 text-xs">/ {plan.plan_name}</span>
                  </div>

                  {/* Features */}
                  <ul className="flex-1 space-y-2.5 mb-6">
                    {features.map((feat, fi) => (
                      <li key={fi} className="flex items-center gap-2.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <span className="text-slate-600 text-xs font-medium">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => openPaymentModal(plan)}
                    disabled={!!processingPlan || isActive}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all
                      ${isActive
                        ? 'bg-violet-100 text-violet-600 cursor-default border border-violet-200'
                        : isPopular
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : isActive ? (
                      <><Check className="h-4 w-4" /> Current Plan</>
                    ) : (
                      <><CreditCard className="h-4 w-4" /> Buy Now — ₹{plan.price.toLocaleString('en-IN')}</>
                    )}
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Guarantees bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 bg-slate-50 border border-slate-100 rounded-3xl p-6">
        {[
          { icon: Sparkles, title: "Instant Activation", desc: "Access unlocks immediately after payment verification — no manual delays." },
          { icon: ShieldCheck, title: "Secured by Razorpay", desc: "Industry-standard SSL encryption protects every transaction." },
          { icon: Zap, title: "Flexible Plans", desc: "Renew or extend any time. Subscription expiry is tracked automatically." },
        ].map((g, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
              <g.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{g.title}</h4>
              <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{g.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {paymentModal.show && paymentModal.plan && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800">Checkout: {paymentModal.plan.plan_name} Plan</h3>
              <button onClick={() => setPaymentModal({ show: false, plan: null, method: null })} className="text-slate-400 hover:text-slate-600">
                &times;
              </button>
            </div>
            
            <div className="p-6">
              {!paymentModal.method ? (
                <div className="space-y-4">
                  <p className="text-sm text-slate-500 text-center mb-6">Choose your preferred payment method to pay <span className="font-bold text-slate-800">₹{paymentModal.plan.price}</span></p>
                  <button
                    onClick={() => setPaymentModal(prev => ({ ...prev, method: 'razorpay' }))}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold transition-all border border-blue-200"
                  >
                    <CreditCard className="h-5 w-5" /> Pay via Razorpay
                  </button>
                  <button
                    onClick={() => setPaymentModal(prev => ({ ...prev, method: 'qr' }))}
                    className="w-full flex items-center justify-center gap-3 py-3.5 rounded-2xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-bold transition-all border border-indigo-200"
                  >
                    <Zap className="h-5 w-5" /> Pay via QR Code (UPI)
                  </button>
                </div>
              ) : paymentModal.method === 'razorpay' ? (
                <RazorpayLoader plan={paymentModal.plan} onTrigger={handleRazorpayFlow} />
              ) : (
                <form onSubmit={handleQRSubmit} className="space-y-5">
                  <div className="text-center">
                    {qrImageUrl ? (
                      <img
                        key={qrTimestamp}
                        src={buildQRSrc(qrImageUrl, qrTimestamp)}
                        alt="Scan to pay"
                        className="w-48 h-48 mx-auto border-4 border-slate-50 rounded-xl shadow-sm mb-3 object-contain"
                        onLoad={(e) => console.log('[Subscription] QR image loaded successfully from:', e.target.src)}
                        onError={(e) => {
                          console.error('[Subscription] QR image FAILED to load from:', e.target.src);
                          console.error('[Subscription] qrImageUrl value was:', qrImageUrl);
                          console.error('[Subscription] API_BASE was:', API_BASE);
                          e.target.src = 'https://placehold.co/200x200?text=QR+Not+Set';
                        }}
                      />
                    ) : (
                      <div className="w-48 h-48 mx-auto border-4 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center mb-3 bg-slate-50">
                        <p className="text-xs text-slate-400 font-semibold text-center px-3">QR code not configured yet.</p>
                        <p className="text-[10px] text-slate-300 mt-1">Ask admin to upload one.</p>
                      </div>
                    )}
                    <p className="text-sm font-bold text-slate-800">Scan to pay ₹{paymentModal.plan.price}</p>
                    <p className="text-xs text-slate-500 mt-1">Please scan the QR code using any UPI app.</p>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Transaction ID / UTR</label>
                    <input 
                      required 
                      type="text" 
                      value={transactionId} 
                      onChange={e => setTransactionId(e.target.value)}
                      placeholder="e.g. 123456789012"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 outline-none focus:border-indigo-500" 
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Payment Screenshot</label>
                    <input 
                      required 
                      type="file" 
                      accept="image/*"
                      onChange={handleQRFileChange}
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" 
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={!!processingPlan || detectingTxn}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                  >
                    {processingPlan || detectingTxn ? <><Loader2 className="h-4 w-4 animate-spin" /> {detectingTxn ? 'Analyzing Image...' : 'Submitting...'}</> : <><Check className="h-4 w-4" /> Submit Payment</>}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const RazorpayLoader = ({ plan, onTrigger }) => {
  useEffect(() => {
    onTrigger(plan);
  }, [plan, onTrigger]);

  return (
    <div className="flex flex-col items-center justify-center py-10 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
      <p className="text-sm font-medium text-slate-600">Opening Razorpay checkout gateway...</p>
    </div>
  );
};

export default Subscription;

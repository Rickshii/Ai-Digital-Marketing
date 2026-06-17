import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, CreditCard, Sparkles, ShieldCheck, Zap, AlertCircle,
  Loader2, Calendar, Clock
} from 'lucide-react';

// Plan feature lists keyed by plan_name
const PLAN_FEATURES = {
  "15 Days": [
    "Full Website Audit & Crawling",
    "SEO Factor Analysis",
    "Marketing Strategy Recommendations",
    "Social Media Integrations",
    "Unlimited PDF Report Downloads",
  ],
  "1 Month": [
    "Full Website Audit & Crawling",
    "SEO Factor Analysis",
    "Marketing Strategy Recommendations",
    "Social Media Integrations",
    "Unlimited PDF Report Downloads",
    "Priority Customer Support",
  ],
  "3 Months": [
    "Full Website Audit & Crawling",
    "SEO Factor Analysis",
    "Marketing Strategy Recommendations",
    "Social Media Integrations",
    "Unlimited PDF Report Downloads",
    "Priority Customer Support",
    "Advanced Competitor Mapping",
  ],
  "6 Months": [
    "Full Website Audit & Crawling",
    "SEO Factor Analysis",
    "Marketing Strategy Recommendations",
    "Social Media Integrations",
    "Unlimited PDF Report Downloads",
    "24/7 Dedicated Support",
    "Advanced Competitor Mapping",
    "Custom Logo Report Branding",
  ],
  "1 Year": [
    "Full Website Audit & Crawling",
    "SEO Factor Analysis",
    "Marketing Strategy Recommendations",
    "Social Media Integrations",
    "Unlimited PDF Report Downloads",
    "24/7 Dedicated Support",
    "Advanced Competitor Mapping",
    "Custom Logo Report Branding",
    "SaaS Beta Features Early Access",
  ],
};

const POPULAR_PLAN = "1 Month";

const Subscription = () => {
  const { user, accessStatus, refreshAccessStatus } = useAuth();
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [processingPlan, setProcessingPlan] = useState(null); // which plan is being processed

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await subscriptionAPI.getPlans();
        setPlans(data);
      } catch (err) {
        console.error('Failed to load plans', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

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

  const handleSubscribe = async (plan) => {
    setProcessingPlan(plan.plan_name);
    try {
      const orderData = await subscriptionAPI.createOrder(plan.plan_name);

      if (orderData.is_mock) {
        const confirmed = window.confirm(
          `[DEV MODE] Simulating payment for "${plan.plan_name}" plan (\u20b9${plan.price} / ${plan.duration_days} days).\n\nClick OK to activate the subscription locally.`
        );
        if (!confirmed) { setProcessingPlan(null); return; }

        const res = await subscriptionAPI.verifyPayment({
          plan_name: plan.plan_name,
          amount: plan.price,
          duration_days: plan.duration_days,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `mock_pay_${Math.random().toString(36).substr(2, 10)}`,
          razorpay_signature: 'mock_success_signature',
        });
        if (res.success) {
          await refreshAccessStatus();
          navigate('/dashboard');
        }
        return;
      }

      // Live Razorpay flow
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert('Payment gateway could not be loaded. Please check your internet connection.');
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || 'INR',
        name: 'MarketerAI SaaS',
        description: `${plan.plan_name} Plan \u2014 \u20b9${Number(plan.price).toLocaleString('en-IN')} / ${plan.duration_days} days`,
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
              navigate('/dashboard');
            }
          } catch (err) {
            alert('Payment verification failed: ' + (err.response?.data?.detail || 'Please contact support.'));
          }
        },
        prefill: { name: user?.full_name || '', email: user?.email || '' },
        theme: { color: '#7c3aed' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      alert('Could not create order: ' + (err.response?.data?.detail || 'Server error.'));
    } finally {
      setProcessingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">

      {/* Trial expired alert */}
      {accessStatus && !accessStatus.has_access && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-4 bg-red-50 border border-red-200 rounded-2xl p-5"
        >
          <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800">Your Subscription Has Expired</h3>
            <p className="text-red-700 text-sm mt-1">
              Please choose a plan below to regain access to Website Audit, SEO Analysis, Social Media Analytics, Marketing Strategy, and PDF Reports.
            </p>
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
              const isProcessing = processingPlan === plan.plan_name;
              const features = PLAN_FEATURES[plan.plan_name] || [
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
                    onClick={() => handleSubscribe(plan)}
                    disabled={!!processingPlan}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all
                      ${isPopular
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                    ) : (
                      <><CreditCard className="h-4 w-4" /> Subscribe for ₹{plan.price.toLocaleString('en-IN')}</>
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

      {/* Trial info note */}
      {accessStatus?.trial_active && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <Clock className="h-5 w-5 text-amber-600 shrink-0" />
          <p className="text-amber-800 text-sm">
            <strong>You have {accessStatus.trial_days_left} day{accessStatus.trial_days_left !== 1 ? 's' : ''} left</strong> on your free trial.
            Subscribe now to ensure uninterrupted access.
          </p>
        </div>
      )}
    </div>
  );
};

export default Subscription;

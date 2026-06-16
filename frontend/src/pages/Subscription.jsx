import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscriptionAPI } from '../services/api';
import { motion } from 'framer-motion';
import { Check, CreditCard, Sparkles, ShieldCheck, Zap, AlertCircle } from 'lucide-react';

const Subscription = () => {
  const { user, accessStatus, refreshAccessStatus } = useAuth();
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  const plans = [
    {
      name: "15 Days",
      price: 299,
      days: 15,
      description: "Perfect for quick audit reports and campaign testing.",
      badge: "Trial Extension",
      popular: false,
      features: [
        "Full Website Audit & Crawling",
        "SEO Factor Analysis",
        "Marketing Strategy Recommendations",
        "Social Media Integrations",
        "Unlimited PDF Report downloads"
      ]
    },
    {
      name: "1 Month",
      price: 499,
      days: 30,
      description: "Standard month of full access to refine your marketing systems.",
      badge: "Best Value Starter",
      popular: true,
      features: [
        "Full Website Audit & Crawling",
        "SEO Factor Analysis",
        "Marketing Strategy Recommendations",
        "Social Media Integrations",
        "Unlimited PDF Report downloads",
        "Priority Customer Support"
      ]
    },
    {
      name: "3 Months",
      price: 1299,
      days: 90,
      description: "Medium-term plan for growing businesses and active audits.",
      badge: "Popular Growth Plan",
      popular: false,
      features: [
        "Full Website Audit & Crawling",
        "SEO Factor Analysis",
        "Marketing Strategy Recommendations",
        "Social Media Integrations",
        "Unlimited PDF Report downloads",
        "Priority Customer Support",
        "Advance Competitor Mapping"
      ]
    },
    {
      name: "6 Months",
      price: 2299,
      days: 180,
      description: "Semi-annual package for established marketing consultants.",
      badge: "Professional Tier",
      popular: false,
      features: [
        "Full Website Audit & Crawling",
        "SEO Factor Analysis",
        "Marketing Strategy Recommendations",
        "Social Media Integrations",
        "Unlimited PDF Report downloads",
        "24/7 Dedicated Support Help",
        "Advance Competitor Mapping",
        "Custom Logo Report Branding"
      ]
    },
    {
      name: "1 Year",
      price: 3999,
      days: 365,
      description: "Ultimate yearly pass with full executive privileges.",
      badge: "Enterprise Standard",
      popular: false,
      features: [
        "Full Website Audit & Crawling",
        "SEO Factor Analysis",
        "Marketing Strategy Recommendations",
        "Social Media Integrations",
        "Unlimited PDF Report downloads",
        "24/7 Dedicated Support Help",
        "Advance Competitor Mapping",
        "Custom Logo Report Branding",
        "SaaS Beta Features Early Access"
      ]
    }
  ];

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubscribe = async (planName) => {
    setProcessing(true);
    try {
      const orderData = await subscriptionAPI.createOrder(planName);

      if (orderData.is_mock) {
        // Fallback simulated payment flow
        alert(`Razorpay credentials are not set in .env.\nSimulating secure local checkouts for: ${planName}`);
        
        const verification = {
          plan_name: planName,
          amount: orderData.amount,
          razorpay_order_id: orderData.order_id,
          razorpay_payment_id: `mock_payment_${Math.random().toString(36).substr(2, 10)}`,
          razorpay_signature: "mock_success_signature"
        };
        
        const res = await subscriptionAPI.verifyPayment(verification);
        if (res.success) {
          await refreshAccessStatus();
          alert("Subscription successfully activated via local simulation!");
          navigate('/dashboard');
        }
        return;
      }

      // Live Razorpay payment integration
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        alert("Failed to connect with payment gateway. Please check your internet connectivity.");
        return;
      }

      const options = {
        key: orderData.key_id,
        amount: Math.round(orderData.amount * 100),
        currency: orderData.currency || "INR",
        name: "MarketerAI SaaS",
        description: `Upgrade Account to ${planName} Plan`,
        order_id: orderData.order_id,
        handler: async function (response) {
          try {
            const verification = {
              plan_name: planName,
              amount: orderData.amount,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            };
            const verifyRes = await subscriptionAPI.verifyPayment(verification);
            if (verifyRes.success) {
              await refreshAccessStatus();
              alert(`Success! Plan '${planName}' is now active on your account.`);
              navigate('/dashboard');
            }
          } catch (verifyErr) {
            alert("Verification Failed: " + (verifyErr.response?.data?.detail || "Invalid transaction."));
          }
        },
        prefill: {
          name: user?.full_name || "",
          email: user?.email || ""
        },
        theme: {
          color: "#7c3aed"
        }
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      console.error(err);
      alert("Order Creation Failed: " + (err.response?.data?.detail || "Server communication issue."));
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Alert if expired */}
      {accessStatus && !accessStatus.has_access && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
          <AlertCircle className="h-6 w-6 text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-bold text-red-800">Your Subscription Plan Has Expired</h3>
            <p className="text-red-700 text-sm mt-1">
              To regain access to the Website Audit, SEO audit factors, Social Analysis, and Consolidated Reports modules, please select one of the subscription options below.
            </p>
          </div>
        </motion.div>
      )}

      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <span className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full">
          Simple, Transparent Pricing
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">
          Unlock Premium Marketing Audits & Insights
        </h1>
        <p className="text-slate-500 text-base leading-relaxed">
          Upgrade your platform access to unlock detailed SEO diagnostics, automated marketing strategies, and custom-branded client reports.
        </p>
      </div>

      {/* Subscription Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
        {plans.map((plan, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative flex flex-col justify-between bg-white rounded-3xl p-6 border transition-all ${
              plan.popular
                ? 'border-indigo-600 shadow-lg ring-1 ring-indigo-500/20'
                : 'border-slate-100 shadow-sm'
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full shadow-sm">
                Most Popular
              </span>
            )}
            
            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{plan.badge}</span>
                <h3 className="text-xl font-extrabold text-slate-800 mt-1">{plan.name} Plan</h3>
                <p className="text-slate-400 text-xs leading-normal mt-1">{plan.description}</p>
              </div>

              <div className="flex items-baseline gap-1.5 py-2">
                <span className="text-3xl font-black text-slate-800">₹{plan.price}</span>
                <span className="text-slate-400 text-xs font-medium">/ {plan.days} Days</span>
              </div>

              <div className="border-t border-slate-50 pt-4 space-y-2.5">
                {plan.features.map((feat, fIdx) => (
                  <div key={fIdx} className="flex items-center gap-2.5">
                    <div className="h-4.5 w-4.5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3" />
                    </div>
                    <span className="text-slate-600 text-xs font-semibold">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-50">
              <button
                onClick={() => handleSubscribe(plan.name)}
                disabled={processing}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-600/10'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/50'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CreditCard className="h-4 w-4" />
                {processing ? "Starting Gateway..." : `Subscribe for ₹${plan.price}`}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Core guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 bg-slate-50 border border-slate-100/50 rounded-3xl p-6 mt-6">
        {[
          { icon: Sparkles, title: "Instant Access Activations", desc: "No manual activation delays. Once verified, your premium dashboard features unlock instantly." },
          { icon: ShieldCheck, title: "100% Secured Payments", desc: "Razorpay powers our checkout gateway. Industry standard SSL keeps cards and profiles protected." },
          { icon: Zap, title: "Flexible Validity Tracking", desc: "Extend, renew, or stack subscription packages anytime. Expiry date calculation adapts automatically." }
        ].map((item, idx) => (
          <div key={idx} className="flex gap-4">
            <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center shrink-0">
              <item.icon className="h-5 w-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-sm">{item.title}</h4>
              <p className="text-slate-400 text-xs mt-1 leading-relaxed">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscription;

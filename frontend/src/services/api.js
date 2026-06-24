import axios from 'axios';

// ── API URL Resolution ─────────────────────────────────────────────────────────
// In production (Vercel): set VITE_API_URL in Vercel → Settings → Environment Variables
//   Value example: https://your-backend.up.railway.app
// In local development: leave unset — falls back to localhost:8000
//
// Never set VITE_API_URL=/api — that routes back to Vercel's static file server.

let envApiUrl = import.meta.env.VITE_API_URL;
if (envApiUrl) {
  envApiUrl = envApiUrl.replace(/\/+$/, '');          // strip trailing slashes
  if (!envApiUrl.endsWith('/api')) {
    envApiUrl = `${envApiUrl}/api`;
  }
}

if (import.meta.env.PROD && !envApiUrl) {
  console.error(
    '[MarketerAI] CRITICAL: VITE_API_URL is not set.\n' +
    'Vercel Dashboard → Your Project → Settings → Environment Variables\n' +
    'Add: VITE_API_URL = https://your-backend.up.railway.app\n' +
    'Then trigger a new deployment.'
  );
}

export const API_URL = envApiUrl || `http://${window.location.hostname}:8000/api`;

console.info(`[MarketerAI] API_URL → ${API_URL}`);

// ── Axios instance ─────────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 60000,
});

// Attach JWT token from localStorage on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 (token expired) globally
api.interceptors.response.use(
  (response) => {
    // Guard against Vercel serving its own HTML when VITE_API_URL is missing
    if (
      typeof response.data === 'string' &&
      response.data.trim().toLowerCase().startsWith('<!doctype html>')
    ) {
      const err = new Error('BACKEND_NOT_CONFIGURED');
      err.isBackendNotConfigured = true;
      return Promise.reject(err);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/register')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
export const authAPI = {
  /** Login with email + password, returns { access_token, token_type, user } */
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
    return response.data;
  },

  /** Register a new user account */
  register: async (email, fullName, password) => {
    const response = await api.post('/auth/register', {
      email,
      full_name: fullName,
      password,
    });
    return response.data;
  },

  /** Get the current authenticated user from the database */
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /** Reset password (no email required — demo mode) */
  forgotPassword: async (email, newPassword) => {
    const response = await api.post('/auth/forgot-password', {
      email,
      new_password: newPassword,
    });
    return response.data;
  },

  /** Update profile name or avatar_url in the database */
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  /** Upload a profile photo — persisted via Supabase Storage or local disk */
  uploadAvatar: async (formData) => {
    const response = await api.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** API health check — confirms backend + DB are reachable */
  healthCheck: async () => {
    const response = await api.get('/auth/health');
    return response.data;
  },
};

// ── Business Profile API ───────────────────────────────────────────────────────
export const businessAPI = {
  /** Fetch all business profiles for the current user */
  getProfiles: async () => {
    const response = await api.get('/business/');
    return response.data;
  },

  /** Fetch a single business profile by ID */
  getProfile: async (id) => {
    const response = await api.get(`/business/${id}`);
    return response.data;
  },

  /** Create a new business profile — stored in PostgreSQL */
  createProfile: async (profileData) => {
    const response = await api.post('/business/', profileData);
    return response.data;
  },

  /** Update an existing business profile */
  updateProfile: async (id, profileData) => {
    const response = await api.put(`/business/${id}`, profileData);
    return response.data;
  },

  /** Delete a business profile */
  deleteProfile: async (id) => {
    const response = await api.delete(`/business/${id}`);
    return response.data;
  },
};

// ── Website Audit API ──────────────────────────────────────────────────────────
export const auditAPI = {
  /** Fetch all website audits for the current user */
  getHistory: async () => {
    const response = await api.get('/audit/');
    return response.data;
  },

  /** Fetch a single audit report by ID */
  getReport: async (id) => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  },

  /** Run a new website audit — stored in PostgreSQL on completion */
  runAudit: async (websiteUrl) => {
    const response = await api.post(
      '/audit/',
      { website_url: websiteUrl },
      { timeout: 45000 }
    );
    return response.data;
  },
};

// ── Social Media Analysis API ──────────────────────────────────────────────────
export const socialAPI = {
  /** Run a new social media analysis — stored in PostgreSQL */
  runAnalysis: async (urls) => {
    const response = await api.post('/social/', urls, { timeout: 60000 });
    return response.data;
  },

  /** Fetch all past social media analyses for the current user */
  getHistory: async () => {
    const response = await api.get('/social/');
    return response.data;
  },

  /** Fetch a single social media analysis by ID */
  getReport: async (id) => {
    const response = await api.get(`/social/${id}`);
    return response.data;
  },
};

// ── Marketing Strategy API ─────────────────────────────────────────────────────
export const strategyAPI = {
  /** Get the most recently generated marketing strategy */
  getLatest: async () => {
    const response = await api.get('/strategy/latest');
    return response.data;
  },

  /** Generate a new marketing strategy based on existing data */
  generate: async () => {
    const response = await api.post('/strategy/');
    return response.data;
  },

  /** Fetch all strategies for the current user */
  getHistory: async () => {
    const response = await api.get('/strategy/');
    return response.data;
  },
};

// ── Reports API ────────────────────────────────────────────────────────────────
export const reportsAPI = {
  /** Get all consolidated PDF reports for the current user */
  getReports: async () => {
    const response = await api.get('/reports/');
    return response.data;
  },

  /** Fetch a single report by ID */
  getReport: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },

  /** Generate and store a new consolidated report in PostgreSQL */
  generateReport: async (reportData) => {
    const response = await api.post('/reports/', reportData);
    return response.data;
  },

  /** Delete a report from the database */
  deleteReport: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};

// ── Subscription API ───────────────────────────────────────────────────────────
export const subscriptionAPI = {
  /** Get current user's subscription and trial status from PostgreSQL */
  getStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },

  /** Create a Razorpay payment order */
  createOrder: async (planName) => {
    const response = await api.post('/subscription/create-order', {
      plan_name: planName,
    });
    return response.data;
  },

  /** Verify Razorpay payment and activate subscription */
  verifyPayment: async (verificationData) => {
    const response = await api.post('/subscription/verify-payment', verificationData);
    return response.data;
  },

  /** Submit a UPI QR screenshot for admin verification */
  submitQRPayment: async (formData) => {
    const response = await api.post('/subscription/qr-payment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** OCR-detect a transaction ID from a payment screenshot */
  detectTransaction: async (formData) => {
    const response = await api.post('/subscription/detect-transaction', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Get all available subscription plans from the database */
  getPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },

  /** Get the admin-configured QR payment URL (stored in platform_settings) */
  getQRUrl: async () => {
    const response = await api.get('/subscription/qr-url');
    return response.data?.qr_image_url || null;
  },
};

// ── Admin API ──────────────────────────────────────────────────────────────────
export const adminAPI = {
  /** Get platform-wide statistics from the database */
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  /** List all registered users, with optional search / role / plan filters */
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  /** Get full details for a single user including payments and access status */
  previewUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  /** Update a user's name, email, role, or password */
  updateUser: async (id, updateData) => {
    const response = await api.put(`/admin/users/${id}`, updateData);
    return response.data;
  },

  /** Delete a user and all their data from PostgreSQL */
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  /** List all generated reports (admin view) */
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },

  /** Delete a report as admin */
  deleteReport: async (id) => {
    const response = await api.delete(`/admin/reports/${id}`);
    return response.data;
  },

  // ── Subscription Plan Management ────────────────────────────────────────────

  /** List all subscription plans from the database */
  getPlans: async () => {
    const response = await api.get('/admin/plans');
    return response.data;
  },

  /** Create a new subscription plan — immediately visible to all users */
  createPlan: async (planData) => {
    const response = await api.post('/admin/plans', planData);
    return response.data;
  },

  /** Update an existing subscription plan's price/duration/description */
  updatePlan: async (id, planData) => {
    const response = await api.put(`/admin/plans/${id}`, planData);
    return response.data;
  },

  /** Delete a subscription plan */
  deletePlan: async (id) => {
    const response = await api.delete(`/admin/plans/${id}`);
    return response.data;
  },

  // ── QR Payment Management ───────────────────────────────────────────────────

  /**
   * Upload the platform UPI QR code image.
   * The URL is stored in platform_settings (PostgreSQL) and persists across
   * redeploys. If Supabase Storage is configured, the image is stored there
   * for true cross-device persistence; otherwise a base64 data URL is saved.
   */
  uploadPlatformQR: async (formData) => {
    const response = await api.post('/admin/platform-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  /** Get the current QR code URL from platform_settings */
  getQRUrl: async () => {
    const response = await api.get('/admin/platform-qr');
    return response.data?.qr_image_url || null;
  },

  // ── Payment Verification ────────────────────────────────────────────────────

  /** List all payments pending admin QR verification */
  getPendingPayments: async () => {
    const response = await api.get('/admin/payments/pending');
    return response.data;
  },

  /** Approve a QR payment and activate the user's subscription */
  approvePayment: async (id) => {
    const response = await api.post(`/admin/payments/${id}/approve`);
    return response.data;
  },

  /** Reject a QR payment submission */
  rejectPayment: async (id) => {
    const response = await api.post(`/admin/payments/${id}/reject`);
    return response.data;
  },
};

export default api;

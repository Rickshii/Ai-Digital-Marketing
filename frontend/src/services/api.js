import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:8000/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, 
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);
    const response = await axios.post(`${API_URL}/auth/login`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response.data;
  },
  register: async (email, fullName, password, role = 'user') => {
    const response = await api.post('/auth/register', {
      email,
      full_name: fullName,
      password,
      role,
    });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  forgotPassword: async (email, newPassword) => {
    const response = await api.post('/auth/forgot-password', {
      email,
      new_password: newPassword,
    });
    return response.data;
  },
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },
  uploadAvatar: async (formData) => {
    const response = await api.post('/auth/profile/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
};

export const businessAPI = {
  getProfiles: async () => {
    const response = await api.get('/business/');
    return response.data;
  },
  getProfile: async (id) => {
    const response = await api.get(`/business/${id}`);
    return response.data;
  },
  createProfile: async (profileData) => {
    const response = await api.post('/business/', profileData);
    return response.data;
  },
  updateProfile: async (id, profileData) => {
    const response = await api.put(`/business/${id}`, profileData);
    return response.data;
  },
  deleteProfile: async (id) => {
    const response = await api.delete(`/business/${id}`);
    return response.data;
  },
};

export const auditAPI = {
  getHistory: async () => {
    const response = await api.get('/audit/');
    return response.data;
  },
  getReport: async (id) => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  },
  runAudit: async (websiteUrl) => {
    const response = await api.post('/audit/', { website_url: websiteUrl }, { timeout: 60000 });
    return response.data;
  },
};

export const socialAPI = {
  runAnalysis: async (urls) => {
    const response = await api.post('/social/', urls, { timeout: 60000 });
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/social/');
    return response.data;
  },
  getReport: async (id) => {
    const response = await api.get(`/social/${id}`);
    return response.data;
  },
};

export const strategyAPI = {
  getLatest: async () => {
    const response = await api.get('/strategy/latest');
    return response.data;
  },
  generate: async () => {
    const response = await api.post('/strategy/');
    return response.data;
  },
  getHistory: async () => {
    const response = await api.get('/strategy/');
    return response.data;
  },
};

export const reportsAPI = {
  getReports: async () => {
    const response = await api.get('/reports/');
    return response.data;
  },
  getReport: async (id) => {
    const response = await api.get(`/reports/${id}`);
    return response.data;
  },
  generateReport: async (reportData) => {
    const response = await api.post('/reports/', reportData);
    return response.data;
  },
  deleteReport: async (id) => {
    const response = await api.delete(`/reports/${id}`);
    return response.data;
  },
};

export const subscriptionAPI = {
  getStatus: async () => {
    const response = await api.get('/subscription/status');
    return response.data;
  },
  createOrder: async (planName) => {
    const response = await api.post('/subscription/create-order', { plan_name: planName });
    return response.data;
  },
  verifyPayment: async (verificationData) => {
    const response = await api.post('/subscription/verify-payment', verificationData);
    return response.data;
  },
  submitQRPayment: async (formData) => {
    const response = await api.post('/subscription/qr-payment', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  detectTransaction: async (formData) => {
    const response = await api.post('/subscription/detect-transaction', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getPlans: async () => {
    const response = await api.get('/subscription/plans');
    return response.data;
  },
  getQRUrl: async () => {
    const response = await api.get('/subscription/qr-url');
    return response.data.qr_image_url || null;
  },
};

export const adminAPI = {
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },
  previewUser: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },
  updateUser: async (id, updateData) => {
    const response = await api.put(`/admin/users/${id}`, updateData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },
  getReports: async () => {
    const response = await api.get('/admin/reports');
    return response.data;
  },
  deleteReport: async (id) => {
    const response = await api.delete(`/admin/reports/${id}`);
    return response.data;
  },
  getPlans: async () => {
    const response = await api.get('/admin/plans');
    return response.data;
  },
  createPlan: async (planData) => {
    const response = await api.post('/admin/plans', planData);
    return response.data;
  },
  updatePlan: async (id, planData) => {
    const response = await api.put(`/admin/plans/${id}`, planData);
    return response.data;
  },
  deletePlan: async (id) => {
    const response = await api.delete(`/admin/plans/${id}`);
    return response.data;
  },
  uploadPlatformQR: async (formData) => {
    const response = await api.post('/admin/platform-qr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  getQRUrl: async () => {
    const response = await api.get('/admin/platform-qr');
    return response.data.qr_image_url || null;
  },
  getPendingPayments: async () => {
    const response = await api.get('/admin/payments/pending');
    return response.data;
  },
  approvePayment: async (id) => {
    const response = await api.post(`/admin/payments/${id}/approve`);
    return response.data;
  },
  rejectPayment: async (id) => {
    const response = await api.post(`/admin/payments/${id}/reject`);
    return response.data;
  }
};

export default api;

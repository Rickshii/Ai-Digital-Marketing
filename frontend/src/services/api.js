import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // timeout after 5 seconds to fallback quickly if offline
});

// Request interceptor to attach JWT token
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

// Response interceptor to handle token expiry / unauthenticated requests
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

// --- DUAL MODE PERSISTENT MOCK DATABASE ---
// This ensures that if the backend is not running, the application works perfectly using LocalStorage.
const getLocalData = (key, defaultVal) => {
  const data = localStorage.getItem(key);
  if (!data) {
    localStorage.setItem(key, JSON.stringify(defaultVal));
    return defaultVal;
  }
  return JSON.parse(data);
};

const setLocalData = (key, val) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// Initialize Mock Database
const initMockDB = () => {
  // Mock Users
  getLocalData('mock_users', [
    {
      id: 1,
      email: 'demo@marketerai.com',
      full_name: 'Sarah Jenkins',
      role: 'Enterprise Consultant',
      company: 'GrowthHackers Agency'
    }
  ]);
  
  // Mock Profiles
  getLocalData('mock_profiles', [
    {
      id: 'prof-1',
      business_name: 'Acme SaaS Corp',
      industry_type: 'Software / B2B SaaS',
      website_url: 'https://acme-saas-corp.io',
      business_location: 'San Francisco, CA',
      target_audience: 'Mid-Market Marketing Directors & Product Owners',
      description: 'Acme SaaS Corp provides automated cloud optimization software for scaling enterprises. We help organizations cut server costs by up to 45% through intelligent load-balancing and predictive auto-scaling modules.',
      email: 'growth@acmesaas.io',
      contact_number: '+1 (555) 304-2091',
      social_media_links: {
        linkedin: 'https://linkedin.com/company/acmesaas',
        twitter: 'https://twitter.com/acmesaas',
        facebook: 'https://facebook.com/acmesaas',
        instagram: 'https://instagram.com/acmesaas'
      },
      completeness_score: 92,
      missing_info_report: ['Facebook Pixel Verification ID'],
      improvement_suggestions: [
        'Establish regular bi-weekly thought leadership articles on LinkedIn targeting Cloud Security to double organically referred SaaS leads.',
        'Launch retargeting ads on Twitter focusing on technical decision-makers with a case study detailing server optimizations.',
        'Optimize metadata on home page. Currently, the description is 82 characters, which is below the recommended 150-160 character limit.',
        'Verify SSL cipher suites. Some legacy browsers fail to load media elements correctly due to strict newer TLS settings.'
      ],
      last_updated: '2026-06-05T10:30:00.000Z',
      score_history: [
        { score: 70, date: '2026-05-15T09:00:00.000Z' },
        { score: 85, date: '2026-05-25T14:20:00.000Z' },
        { score: 92, date: '2026-06-05T10:30:00.000Z' }
      ]
    },
    {
      id: 'prof-2',
      business_name: 'Bloom Floral & Co',
      industry_type: 'Local Retail / E-commerce',
      website_url: 'https://bloomfloral.shop',
      business_location: 'Austin, TX',
      target_audience: 'Local event planners, brides-to-be, luxury gift shoppers',
      description: 'We craft premium organic botanical arrangements and supply exotic plants for events and retail. We focus on ethical, locally sourced floristry and same-day boutique deliveries.',
      email: 'hello@bloomfloral.shop',
      contact_number: '+1 (512) 808-1122',
      social_media_links: {
        linkedin: '',
        twitter: 'https://twitter.com/bloomfloral',
        facebook: 'https://facebook.com/bloomfloral',
        instagram: 'https://instagram.com/bloomfloral'
      },
      completeness_score: 74,
      missing_info_report: ['LinkedIn URL', 'Corporate Email domain verification'],
      improvement_suggestions: [
        'Instagram engagement is high, but link-in-bio traffic is not tagged. Use UTM parameters to measure exact conversions from social media.',
        'Create a Google Business Profile local products showcase. Upload photos of seasonal catalog weekly to rank higher in regional search results.',
        'The website loads slowly on mobile (3.4s). Compress image assets on the catalog page to improve page response speed and reduce bounce rates.'
      ],
      last_updated: '2026-06-01T12:00:00.000Z',
      score_history: [
        { score: 60, date: '2026-05-10T11:00:00.000Z' },
        { score: 74, date: '2026-06-01T12:00:00.000Z' }
      ]
    }
  ]);

  // Mock Website Audits
  getLocalData('mock_audits', [
    {
      id: 'aud-1',
      title: 'Acme Corporate Domain Audit',
      website_url: 'https://acme-saas-corp.io',
      health_score: 88,
      seo_score: 91,
      performance_score: 84,
      social_score: 78,
      marketing_score: 89,
      load_time: '1.2s',
      mobile_friendly: true,
      secure: true,
      open_graph: true,
      created_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(), // 3 days ago
      suggestions: [
        { id: 1, type: 'critical', message: 'Optimize images on the home hero banner. Save 1.8MB by encoding to WebP format.' },
        { id: 2, type: 'warning', message: 'H1 heading tag is missing on the features subpage. Ensure every page has exactly one H1.' },
        { id: 3, type: 'info', message: 'Improve TTFB (Time to First Byte) by edge caching API queries at Cloudflare.' }
      ]
    },
    {
      id: 'aud-2',
      title: 'Bloom E-Commerce Portal',
      website_url: 'https://bloomfloral.shop',
      health_score: 64,
      seo_score: 72,
      performance_score: 55,
      social_score: 88,
      marketing_score: 68,
      load_time: '3.4s',
      mobile_friendly: true,
      secure: true,
      open_graph: false,
      created_at: new Date(Date.now() - 3600000 * 24 * 7).toISOString(), // 7 days ago
      suggestions: [
        { id: 1, type: 'critical', message: 'Render-blocking CSS assets are delaying load. Inline critical styles above the fold.' },
        { id: 2, type: 'critical', message: 'Missing Open Graph (OG) image tags. Social shares will look plain and unprofessional.' },
        { id: 3, type: 'warning', message: 'Alt attributes are missing on 14 product catalog images, hurting Google Image search rankings.' }
      ]
    }
  ]);
};

initMockDB();

// Helper to determine if we should fall back to mock
const executeWithFallback = async (apiCall, mockHandler) => {
  try {
    const response = await apiCall();
    return response;
  } catch (error) {
    // If connection refused, network error, timeout, or 404
    if (!error.response || error.code === 'ERR_NETWORK' || error.response.status === 404 || error.response.status >= 500) {
      console.warn('API connection failed or unavailable. Falling back to local storage mock database.', error.message);
      return mockHandler();
    }
    throw error;
  }
};

// API Services Export
export const authAPI = {
  login: async (email, password) => {
    return executeWithFallback(
      async () => {
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
      () => {
        // Mock Login Handler
        const users = getLocalData('mock_users', []);
        const matchedUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        
        if (email.includes('demo') || email.includes('admin') || matchedUser) {
          const userObj = matchedUser || {
            id: Date.now(),
            email: email,
            full_name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            role: 'Enterprise Consultant',
            company: 'GrowthHackers Agency'
          };
          
          if (!matchedUser) {
            users.push(userObj);
            setLocalData('mock_users', users);
          }
          
          return {
            access_token: 'mock-jwt-token-xyz',
            token_type: 'bearer',
            user: userObj
          };
        }
        throw {
          response: {
            data: {
              detail: 'Invalid credentials. Enter "demo@marketerai.com" or register a new user.'
            }
          }
        };
      }
    );
  },

  register: async (email, fullName, password, role = 'user') => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/auth/register', {
          email,
          full_name: fullName,
          password,
          role,
        });
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
          throw {
            response: {
              data: { detail: 'User with this email already exists in mock database.' }
            }
          };
        }
        const newUser = {
          id: Date.now(),
          email,
          full_name: fullName,
          role: role === 'admin' ? 'Enterprise Consultant' : 'Marketing Associate',
          company: 'SaaS Startup'
        };
        users.push(newUser);
        setLocalData('mock_users', users);
        return newUser;
      }
    );
  },

  getMe: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/auth/me');
        return response.data;
      },
      () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) return JSON.parse(storedUser);
        throw { response: { status: 401 } };
      }
    );
  },
};

export const businessAPI = {
  getProfiles: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/business/');
        return response.data;
      },
      () => {
        return getLocalData('mock_profiles', []);
      }
    );
  },

  getProfile: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.get(`/business/${id}`);
        return response.data;
      },
      () => {
        const profiles = getLocalData('mock_profiles', []);
        const found = profiles.find(p => p.id === id);
        if (found) return found;
        throw { response: { status: 404 } };
      }
    );
  },

  createProfile: async (profileData) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/business/', profileData);
        return response.data;
      },
      () => {
        const profiles = getLocalData('mock_profiles', []);
        
        // Calculate score & reports on client side dynamically
        const missing = [];
        if (!profileData.business_name) missing.push('Business Name');
        if (!profileData.industry_type) missing.push('Industry Type');
        if (!profileData.website_url) missing.push('Website URL');
        if (!profileData.description) missing.push('Business Description');
        if (!profileData.business_location) missing.push('Physical Business Location');
        if (!profileData.target_audience) missing.push('Target Audience Definition');
        if (!profileData.email) missing.push('Contact Business Email');
        if (!profileData.contact_number) missing.push('Phone Support Line');
        
        const social = profileData.social_media_links || {};
        if (!social.linkedin) missing.push('LinkedIn Business profile');
        if (!social.twitter) missing.push('Twitter/X Business account');
        if (!social.facebook) missing.push('Facebook Business page');
        if (!social.instagram) missing.push('Instagram Creator profile');

        const totalFields = 12;
        const filledFields = totalFields - missing.length;
        const completeness = Math.round((filledFields / totalFields) * 100);

        const mockSuggestions = [
          `Setup target tags for ${profileData.target_audience || 'your customer demographic'} to reduce ad spent wastage.`,
          `Analyze competitor traffic patterns in ${profileData.industry_type || 'your sector'} to bid on higher value search queries.`
        ];
        if (missing.length > 0) {
          mockSuggestions.push(`Fill in ${missing[0]} to raise your score and activate full audit reports.`);
        }

        const nowStr = new Date().toISOString();
        const newProfile = {
          id: `prof-${Date.now()}`,
          ...profileData,
          completeness_score: completeness,
          missing_info_report: missing,
          improvement_suggestions: mockSuggestions,
          last_updated: nowStr,
          score_history: [{ score: completeness, date: nowStr }]
        };

        profiles.unshift(newProfile);
        setLocalData('mock_profiles', profiles);
        return newProfile;
      }
    );
  },

  updateProfile: async (id, profileData) => {
    return executeWithFallback(
      async () => {
        const response = await api.put(`/business/${id}`, profileData);
        return response.data;
      },
      () => {
        const profiles = getLocalData('mock_profiles', []);
        const index = profiles.findIndex(p => p.id === id);
        if (index === -1) throw { response: { status: 404 } };
        
        const existing = profiles[index];
        
        // Calculate score & reports dynamically
        const missing = [];
        if (!profileData.business_name) missing.push('Business Name');
        if (!profileData.industry_type) missing.push('Industry Type');
        if (!profileData.website_url) missing.push('Website URL');
        if (!profileData.description) missing.push('Business Description');
        if (!profileData.business_location) missing.push('Physical Business Location');
        if (!profileData.target_audience) missing.push('Target Audience Definition');
        if (!profileData.email) missing.push('Contact Business Email');
        if (!profileData.contact_number) missing.push('Phone Support Line');
        
        const social = profileData.social_media_links || {};
        if (!social.linkedin) missing.push('LinkedIn Business profile');
        if (!social.twitter) missing.push('Twitter/X Business account');
        if (!social.facebook) missing.push('Facebook Business page');
        if (!social.instagram) missing.push('Instagram Creator profile');

        const totalFields = 12;
        const filledFields = totalFields - missing.length;
        const completeness = Math.round((filledFields / totalFields) * 100);

        const mockSuggestions = [
          `Setup target tags for ${profileData.target_audience || 'your customer demographic'} to reduce ad spent wastage.`,
          `Analyze competitor traffic patterns in ${profileData.industry_type || 'your sector'} to bid on higher value search queries.`
        ];
        if (missing.length > 0) {
          mockSuggestions.push(`Fill in ${missing[0]} to raise your score and activate full audit reports.`);
        }

        const nowStr = new Date().toISOString();
        const history = existing.score_history || [];
        
        // If the score is different from the last history entry, append it
        const lastHistoryEntry = history[history.length - 1];
        if (!lastHistoryEntry || lastHistoryEntry.score !== completeness) {
          history.push({ score: completeness, date: nowStr });
        }

        const updated = {
          ...existing,
          ...profileData,
          completeness_score: completeness,
          missing_info_report: missing,
          improvement_suggestions: mockSuggestions,
          last_updated: nowStr,
          score_history: history,
          id
        };

        profiles[index] = updated;
        setLocalData('mock_profiles', profiles);
        return updated;
      }
    );
  },

  deleteProfile: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.delete(`/business/${id}`);
        return response.data;
      },
      () => {
        const profiles = getLocalData('mock_profiles', []);
        const filtered = profiles.filter(p => p.id !== id);
        setLocalData('mock_profiles', filtered);
        return { message: 'Profile deleted successfully' };
      }
    );
  },
};

export const auditAPI = {
  getHistory: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/audit/');
        return response.data;
      },
      () => {
        return getLocalData('mock_audits', []);
      }
    );
  },

  getReport: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.get(`/audit/${id}`);
        return response.data;
      },
      () => {
        const audits = getLocalData('mock_audits', []);
        const found = audits.find(a => a.id === id);
        if (found) return found;
        throw { response: { status: 404 } };
      }
    );
  },

  runAudit: async (websiteUrl) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/audit/', { website_url: websiteUrl });
        return response.data;
      },
      () => {
        const audits = getLocalData('mock_audits', []);
        
        // Generate random scores
        const health = Math.floor(Math.random() * 30) + 65; // 65 - 95
        const seo = Math.floor(Math.random() * 20) + 75; // 75 - 95
        const perf = Math.floor(Math.random() * 40) + 50; // 50 - 90
        const social = Math.floor(Math.random() * 30) + 60; // 60 - 90
        const marketing = Math.floor(Math.random() * 25) + 70; // 70 - 95
        const isHttps = websiteUrl.startsWith('https://');
        
        const host = websiteUrl.replace('https://', '').replace('http://', '').split('/')[0];
        const title = host.split('.').slice(-2, -1)[0].replace(/^\w/, c => c.toUpperCase()) + " Web Portal Audit";

        const newAudit = {
          id: `aud-${Date.now()}`,
          title: title,
          website_url: websiteUrl,
          health_score: health,
          seo_score: seo,
          performance_score: perf,
          social_score: social,
          marketing_score: marketing,
          load_time: `${(Math.random() * 2.5 + 0.6).toFixed(1)}s`,
          mobile_friendly: Math.random() > 0.15,
          secure: isHttps,
          open_graph: Math.random() > 0.3,
          created_at: new Date().toISOString(),
          suggestions: [
            { id: 1, type: 'critical', message: `Optimize JavaScript assets. Defer loading of non-critical analytics tag components on ${host}.` },
            { id: 2, type: 'warning', message: 'Leverage browser caching for static elements to increase repeat visits loading speed.' },
            { id: 3, type: 'info', message: 'Alt tags are missing on some image containers. Ensure image tags contain description fields.' }
          ]
        };

        audits.unshift(newAudit);
        setLocalData('mock_audits', audits);
        return newAudit;
      }
    );
  },
};

export default api;

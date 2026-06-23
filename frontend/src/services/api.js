import axios from 'axios';

let envApiUrl = import.meta.env.VITE_API_URL;
if (envApiUrl) {
  // Remove any trailing slashes
  envApiUrl = envApiUrl.replace(/\/+$/, '');
  // Append /api if it doesn't already end with it
  if (!envApiUrl.endsWith('/api')) {
    envApiUrl = `${envApiUrl}/api`;
  }
}

const API_URL = envApiUrl || (import.meta.env.PROD ? '/api' : `http://${window.location.hostname}:8000/api`);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 50000, // default timeout — overridden per-call for long-running audit/social requests
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
  (response) => {
    // Reject unexpected HTML responses (caused by Vercel rewrites when VITE_API_URL is missing)
    if (typeof response.data === 'string' && response.data.trim().toLowerCase().startsWith('<!doctype html>')) {
      console.error("Critical: Received HTML instead of JSON. Ensure VITE_API_URL is set correctly.");
      return Promise.reject(new Error("Invalid API response format (HTML)."));
    }
    return response;
  },
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

// --- LOCAL STORAGE UTILS (Kept for caching purposes) ---
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

// Helper to fall back to mock data if the backend is unavailable or failing
const executeWithFallback = async (apiCall, mockHandler) => {
  // To enforce relying exclusively on the PostgreSQL database, we throw the API error directly and bypass mock handlers.
  return await apiCall();
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
          const isAdminEmail = email.toLowerCase().includes('admin');
          const userObj = matchedUser || {
            id: Date.now(),
            email: email,
            full_name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, c => c.toUpperCase()),
            role: isAdminEmail ? 'admin' : 'user',
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
        const isAdminEmail = email.toLowerCase().includes('admin');
        const newUser = {
          id: Date.now(),
          email,
          full_name: fullName,
          role: (role === 'admin' || isAdminEmail) ? 'admin' : 'user',
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
        if (storedUser) {
          return JSON.parse(storedUser);
        }
        throw { response: { status: 401 } };
      }
    );
  },



  forgotPassword: async (email, newPassword) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/auth/forgot-password', {
          email,
          new_password: newPassword,
        });
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!user && !email.includes('demo') && !email.includes('admin')) {
          throw {
            response: {
              data: { detail: 'No account found with this email address.' }
            }
          };
        }
        if (newPassword.length < 6) {
          throw {
            response: {
              data: { detail: 'Password must be at least 6 characters.' }
            }
          };
        }
        return { detail: 'Password has been reset successfully. You can now log in with your new password.' };
      }
    );
  },

  updateProfile: async (profileData) => {
    return executeWithFallback(
      async () => {
        const response = await api.put('/auth/profile', profileData);
        return response.data;
      },
      () => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          const updated = { ...user, ...profileData };
          localStorage.setItem('user', JSON.stringify(updated));
          
          const users = getLocalData('mock_users', []);
          const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
          if (idx !== -1) {
            users[idx] = { ...users[idx], ...profileData };
            setLocalData('mock_users', users);
          }
          return updated;
        }
        throw new Error('Not logged in');
      }
    );
  },

  uploadAvatar: async (formData) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/auth/profile/avatar', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      },
      () => {
        const file = formData.get('file');
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result;
            const storedUser = localStorage.getItem('user');
            if (storedUser) {
              const user = JSON.parse(storedUser);
              const updated = { ...user, avatar_url: dataUrl };
              localStorage.setItem('user', JSON.stringify(updated));
              
              const users = getLocalData('mock_users', []);
              const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
              if (idx !== -1) {
                users[idx] = { ...users[idx], avatar_url: dataUrl };
                setLocalData('mock_users', users);
              }
              resolve({ success: true, avatar_url: dataUrl });
            } else {
              reject(new Error('Not logged in'));
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
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
        if (!profileData.business_category) missing.push('Business Category');
        if (!profileData.industry_type) missing.push('Industry Type');
        if (!profileData.website_url) missing.push('Website URL');
        if (!profileData.description) missing.push('Business Description');
        if (!profileData.business_address) missing.push('Street Address');
        if (!profileData.city) missing.push('City');
        if (!profileData.state) missing.push('State');
        if (!profileData.pincode) missing.push('Pincode');
        if (!profileData.target_audience) missing.push('Target Audience Definition');
        if (!profileData.email) missing.push('Business Email');
        if (!profileData.contact_number) missing.push('Contact Phone');
        if (!profileData.whatsapp_number) missing.push('WhatsApp Business Number');
        if (profileData.google_profile_registered !== 'Yes') missing.push('Google Business Profile not registered');
        if (!profileData.google_maps_link) missing.push('Google Maps Location Link');
        
        const social = profileData.social_media_links || {};
        if (!social.facebook) missing.push('Facebook Business page');
        if (!social.instagram) missing.push('Instagram Creator profile');
        if (!social.linkedin) missing.push('LinkedIn Business profile');
        if (!social.youtube) missing.push('YouTube Channel');

        const totalFields = 19;
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
        if (!profileData.business_category) missing.push('Business Category');
        if (!profileData.industry_type) missing.push('Industry Type');
        if (!profileData.website_url) missing.push('Website URL');
        if (!profileData.description) missing.push('Business Description');
        if (!profileData.business_address) missing.push('Street Address');
        if (!profileData.city) missing.push('City');
        if (!profileData.state) missing.push('State');
        if (!profileData.pincode) missing.push('Pincode');
        if (!profileData.target_audience) missing.push('Target Audience Definition');
        if (!profileData.email) missing.push('Business Email');
        if (!profileData.contact_number) missing.push('Contact Phone');
        if (!profileData.whatsapp_number) missing.push('WhatsApp Business Number');
        if (profileData.google_profile_registered !== 'Yes') missing.push('Google Business Profile not registered');
        if (!profileData.google_maps_link) missing.push('Google Maps Location Link');
        
        const social = profileData.social_media_links || {};
        if (!social.facebook) missing.push('Facebook Business page');
        if (!social.instagram) missing.push('Instagram Creator profile');
        if (!social.linkedin) missing.push('LinkedIn Business profile');
        if (!social.youtube) missing.push('YouTube Channel');

        const totalFields = 19;
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
        // Audits scrape the web — give them a longer timeout
        const response = await api.post('/audit/', { website_url: websiteUrl }, { timeout: 30000 });
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

export const socialAPI = {
  runAnalysis: async (urls) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/social/', urls, { timeout: 45000 });
        return response.data;
      },
      () => {
        // Mock social media analysis for offline/demo mode
        const analyses = getLocalData('mock_social_analyses', []);
        const platforms = ['facebook', 'instagram', 'linkedin', 'youtube'];
        const platformResults = {};

        platforms.forEach(p => {
          const url = urls[`${p}_url`];
          if (url) {
            platformResults[p] = {
              platform: p,
              url,
              reachable: true,
              profile_found: true,
              has_bio: Math.random() > 0.3,
              has_contact: Math.random() > 0.4,
              has_website_link: Math.random() > 0.35,
              has_recent_activity: Math.random() > 0.25,
              posting_frequency: ['Daily', '3x/week', 'Weekly', 'Bi-weekly'][Math.floor(Math.random() * 4)],
              followers: `${(Math.random() * 50 + 1).toFixed(1)}K`,
              posts_count: `${Math.floor(Math.random() * 500 + 20)}`,
              profile_picture: true,
              completeness_score: Math.floor(Math.random() * 40) + 55,
              issues: Math.random() > 0.5 ? ['No contact information detected', 'Recent activity not confirmed'] : ['Bio appears incomplete'],
              strengths: ['Profile picture set', 'Bio present', 'Website link found'].slice(0, Math.floor(Math.random() * 3) + 1),
            };
          } else {
            platformResults[p] = null;
          }
        });

        const found = Object.values(platformResults).filter(Boolean).length;
        const scores = Object.values(platformResults)
          .filter(Boolean)
          .map(r => r.completeness_score);
        const avgScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
        const socialScore = Math.min(100, Math.round(found * 10 + avgScore * 0.6));

        const newAnalysis = {
          id: `soc-${Date.now()}`,
          ...urls,
          facebook_analysis: platformResults.facebook,
          instagram_analysis: platformResults.instagram,
          linkedin_analysis: platformResults.linkedin,
          youtube_analysis: platformResults.youtube,
          platforms_found: found,
          platforms_analyzed: found,
          social_score: socialScore,
          profile_completeness: avgScore,
          missing_elements: [
            !urls.facebook_url ? 'Facebook profile URL not provided' : null,
            !urls.instagram_url ? 'Instagram profile URL not provided' : null,
            !urls.linkedin_url ? 'LinkedIn profile URL not provided' : null,
            !urls.youtube_url ? 'YouTube channel URL not provided' : null,
          ].filter(Boolean),
          growth_suggestions: [
            'Post 3–5x per week on your most engaged platform to maximize algorithm reach.',
            'Use a consistent brand voice and profile imagery across all platforms.',
            'Add your website URL to every social profile to drive traffic and boost SEO.',
            'Engage with comments within the first hour of posting — early engagement signals matter.',
            'Schedule content in advance with tools like Buffer or Hootsuite for consistency.',
          ],
          analysis_summary: {
            platforms_found: found,
            platforms_analyzed: found,
            social_score: socialScore,
            profile_completeness: avgScore,
            per_platform_scores: {
              facebook: platformResults.facebook?.completeness_score || 0,
              instagram: platformResults.instagram?.completeness_score || 0,
              linkedin: platformResults.linkedin?.completeness_score || 0,
              youtube: platformResults.youtube?.completeness_score || 0,
            },
          },
          created_at: new Date().toISOString(),
        };

        analyses.unshift(newAnalysis);
        setLocalData('mock_social_analyses', analyses);
        return newAnalysis;
      }
    );
  },

  getHistory: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/social/');
        return response.data;
      },
      () => getLocalData('mock_social_analyses', [])
    );
  },

  getReport: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.get(`/social/${id}`);
        return response.data;
      },
      () => {
        const analyses = getLocalData('mock_social_analyses', []);
        const found = analyses.find(a => a.id === id);
        if (found) return found;
        throw { response: { status: 404 } };
      }
    );
  },
};

export const strategyAPI = {
  getLatest: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/strategy/latest');
        return response.data;
      },
      () => {
        const strategies = getLocalData('mock_strategies', []);
        if (strategies.length > 0) return strategies[0];
        // If empty, generate a mock strategy
        return strategyAPI.generate();
      }
    );
  },

  generate: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/strategy/');
        return response.data;
      },
      () => {
        const strategies = getLocalData('mock_strategies', []);
        const profiles = getLocalData('mock_profiles', []);
        const audits = getLocalData('mock_audits', []);
        const socials = getLocalData('mock_social_analyses', []);

        const latestProfile = profiles[0] || {};
        const latestAudit = audits[0] || {};
        const latestSocial = socials[0] || {};

        const bizScore = latestProfile.completeness_score || 50;
        const webHealth = latestAudit.health_score || 50;
        const seoScore = latestAudit.seo_score || 50;
        const socialScore = latestSocial.social_score || 50;

        const strategyScore = Math.round((bizScore + webHealth + seoScore + socialScore) / 4);

        const newStrategy = {
          id: Date.now(),
          business_profile_id: latestProfile.id || null,
          strategy_score: strategyScore,
          active_tasks: `0/12`,
          reach_estimate: `${Math.round(strategyScore * 0.5)}K+`,
          projected_roi: `${strategyScore * 4}%`,
          scores_used: {
            business_score: bizScore,
            website_health_score: webHealth,
            seo_score: seoScore,
            social_media_score: socialScore
          },
          plan_30_day: [
            {
              week: "Week 1",
              title: "Foundation & Brand Audit",
              tasks: [
                "Complete brand voice guidelines doc",
                "Audit all existing content for consistency",
                bizScore < 70 ? "Complete missing business profile fields" : "Analyze key search phrases of top 3 competitors"
              ],
              status: "active"
            },
            {
              week: "Week 2",
              title: "SEO & Content Launch",
              tasks: [
                seoScore < 75 ? "Submit sitemap.xml and robots.txt to Google Console" : "Publish 2 high-quality SEO-optimized articles",
                "Build 10 internal links across site",
                webHealth < 75 ? "Compress hero images and static assets to WebP" : "Set up lead-capture signup form"
              ],
              status: "pending"
            },
            {
              week: "Week 3",
              title: "Social Media Activation",
              tasks: [
                socialScore < 60 ? "Set up missing Facebook, Instagram and LinkedIn profiles" : "Optimize layout and bios of active profiles",
                "Schedule 3 educational social media posts",
                "Engage with 15-20 target customer profiles daily"
              ],
              status: "pending"
            },
            {
              week: "Week 4",
              title: "Lead Generation & Review",
              tasks: [
                "Launch lead magnet (free PDF/guide)",
                "Review first month analytics",
                "Perform monthly marketing audit"
              ],
              status: "pending"
            }
          ],
          plan_90_day: [
            {
              month: "Month 2",
              title: "Growth Acceleration",
              desc: "Scale organic search traffic. Implement weekly blog schedule. Deploy lead magnet across premium visual ads."
            },
            {
              month: "Month 3",
              title: "Revenue Optimization",
              desc: "A/B test homepage CTAs. Launch retargeting ads to recapture cart abandoners. Refine welcome sequence."
            },
            {
              month: "Ongoing",
              title: "Brand Authority",
              desc: "Establish thought leadership. Publish client success stories. Target high-authority backlinks."
            }
          ],
          branding_strategy: {
            brand_voice: "Helpful, transparent, innovative, and user-centric.",
            positioning_statement: `For target customers who need reliable services, ${latestProfile.business_name || 'your business'} offers premium solutions. Unlike competitors, we build long-term value through expertise and responsiveness.`,
            visual_identity_tips: [
              "Maintain consistent colors and font hierarchy across all marketing channels.",
              "Use high-quality product photography rather than generic stock vectors."
            ]
          },
          lead_gen_strategy: {
            recommended_lead_magnet: "The Ultimate Step-by-Step Industry Playbook (PDF)",
            conversion_funnel: [
              "1. Drive traffic via value blog content.",
              "2. Offer PDF playbook via high-visibility opt-in forms.",
              "3. Follow up using a 4-part email drip sequence."
            ],
            landing_page_tips: [
              "Keep the signup form short (name and email only).",
              "Highlight at least two customer testimonials near the CTA."
            ]
          },
          content_strategy: {
            content_pillars: ["Educational Tips (50%)", "Industry Updates (20%)", "Behind the Scenes (30%)"],
            suggested_formats: ["Long-form blogs", "Social carousel posts", "Monthly email newsletter"],
            calendar_snapshot: [
              { day: "Monday", format: "Educational Post", topic: "Pro tips for scaling operations" },
              { day: "Wednesday", format: "Social Carousel", topic: "Product spotlight breakdown" },
              { day: "Friday", format: "Customer Love", topic: "Highlighting a recent client milestone" }
            ]
          },
          social_media_strategy: {
            channel_mix: [
              { name: "SEO & Content", budget: 35 },
              { name: "Paid Social Ads", budget: 25 },
              { name: "Email Marketing", budget: 20 },
              { name: "Google Ads", budget: 15 },
              { name: "Influencer", budget: 5 }
            ],
            posting_schedule: "Publish at least 3-4 times per week during peak hours (noon and 6 PM)."
          },
          created_at: new Date().toISOString()
        };

        strategies.unshift(newStrategy);
        setLocalData('mock_strategies', strategies);
        return newStrategy;
      }
    );
  },

  getHistory: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/strategy/');
        return response.data;
      },
      () => getLocalData('mock_strategies', [])
    );
  }
};

export const reportsAPI = {
  getReports: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/reports/');
        return response.data;
      },
      () => {
        const reports = getLocalData('mock_reports', []);
        if (reports.length === 0) {
          const initialReports = [
            {
              id: 1,
              report_id: 'REP-100482',
              title: 'Comprehensive Digital Marketing Analysis',
              type: 'comprehensive',
              scores: { business: 95, health: 88, seo: 91, social: 78, marketing: 88 },
              created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
              business_overview: { business_name: "Acme SaaS Corp", industry_type: "SaaS / Technology" },
              website_audit: { website_url: "https://acme-saas-corp.io", health_score: 88, seo_score: 91 },
              seo_audit: { seo_score: 91, has_robots_txt: true, has_sitemap: true },
              social_media_analysis: { social_score: 78, platforms_found: 4 },
              marketing_strategy: { strategy_score: 88, projected_roi: "350%" }
            }
          ];
          setLocalData('mock_reports', initialReports);
          return initialReports;
        }
        return reports;
      }
    );
  },

  getReport: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.get(`/reports/${id}`);
        return response.data;
      },
      () => {
        const reports = getLocalData('mock_reports', []);
        const found = reports.find(r => r.id === parseInt(id) || r.id === id);
        if (found) return found;
        throw { response: { status: 404 } };
      }
    );
  },

  generateReport: async (reportData) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/reports/', reportData);
        return response.data;
      },
      () => {
        const reports = getLocalData('mock_reports', []);
        const profiles = getLocalData('mock_profiles', []);
        const audits = getLocalData('mock_audits', []);
        const socials = getLocalData('mock_social_analyses', []);
        const strategies = getLocalData('mock_strategies', []);

        const profile = profiles[0] || {};
        const audit = audits[0] || {};
        const social = socials[0] || {};
        const strategy = strategies[0] || {};

        const bizScore = profile.completeness_score || 50;
        const healthScore = audit.health_score || 50;
        const seoScore = audit.seo_score || 50;
        const socialScore = social.social_score || 50;
        const strategyScore = strategy.strategy_score || 50;

        const newReport = {
          id: Date.now(),
          report_id: `REP-${Math.floor(Math.random() * 900000) + 100000}`,
          title: reportData.title || `${profile.business_name || 'My Business'} Consolidated Audit Report`,
          type: reportData.type || 'comprehensive',
          scores: {
            business: bizScore,
            health: healthScore,
            seo: seoScore,
            social: socialScore,
            marketing: strategyScore
          },
          business_overview: profile.id ? {
            business_name: profile.business_name,
            industry_type: profile.industry_type,
            website_url: profile.website_url,
            business_location: profile.business_location,
            target_audience: profile.target_audience,
            description: profile.description,
            completeness_score: bizScore,
            improvement_suggestions: profile.improvement_suggestions || []
          } : null,
          website_audit: audit.id ? {
            website_url: audit.website_url,
            title: audit.title,
            is_https: audit.secure,
            health_score: healthScore,
            seo_score: seoScore,
            load_time: audit.load_time,
            improvement_suggestions: (audit.suggestions || []).map(s => s.message)
          } : null,
          seo_audit: audit.id ? {
            seo_score: seoScore,
            has_robots_txt: true,
            has_sitemap: true,
            has_canonical: true,
            seo_errors: (audit.suggestions || []).filter(s => s.type === 'critical').map(s => ({ message: s.message, level: 'critical' }))
          } : null,
          social_media_analysis: social.id ? {
            social_score: socialScore,
            profile_completeness: social.profile_completeness,
            facebook_url: social.facebook_url,
            instagram_url: social.instagram_url,
            linkedin_url: social.linkedin_url,
            youtube_url: social.youtube_url,
            missing_elements: social.missing_elements || [],
            growth_suggestions: social.growth_suggestions || []
          } : null,
          marketing_strategy: strategy.id ? {
            strategy_score: strategyScore,
            active_tasks: strategy.active_tasks,
            reach_estimate: strategy.reach_estimate,
            projected_roi: strategy.projected_roi,
            plan_30_day: strategy.plan_30_day,
            plan_90_day: strategy.plan_90_day,
            branding_strategy: strategy.branding_strategy,
            lead_gen_strategy: strategy.lead_gen_strategy,
            content_strategy: strategy.content_strategy,
            social_media_strategy: strategy.social_media_strategy
          } : null,
          created_at: new Date().toISOString()
        };

        reports.unshift(newReport);
        setLocalData('mock_reports', reports);
        return newReport;
      }
    );
  },

  deleteReport: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.delete(`/reports/${id}`);
        return response.data;
      },
      () => {
        const reports = getLocalData('mock_reports', []);
        const filtered = reports.filter(r => r.id !== id && r.id !== parseInt(id));
        setLocalData('mock_reports', filtered);
        return { message: 'Report deleted successfully' };
      }
    );
  }
};

export const subscriptionAPI = {
  getStatus: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/subscription/status');
        return response.data;
      },
      () => {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user) return { has_access: false, trial_active: false, trial_days_left: 0 };
        
        const isAdmin = user.role === 'admin' || user.email?.toLowerCase().includes('admin');
        if (isAdmin) {
          return {
            has_access: true,
            trial_active: true,
            trial_days_left: 9999,
            subscription_active: true,
            subscription_plan: "Enterprise Admin",
            role: "admin"
          };
        }

        const mockSub = getLocalData('mock_subscription', {
          has_access: true,
          trial_active: true,
          trial_days_left: 3,
          trial_start: new Date().toISOString(),
          trial_expiry: new Date(Date.now() + 3600000 * 24 * 3).toISOString(),
          subscription_active: false,
          subscription_plan: null,
          subscription_expiry: null,
          role: "user"
        });
        
        const now = new Date();
        const trialExpiry = new Date(mockSub.trial_expiry);
        const subExpiry = mockSub.subscription_expiry ? new Date(mockSub.subscription_expiry) : null;
        
        const trialActive = trialExpiry > now;
        const subActive = subExpiry ? subExpiry > now : false;
        
        const delta = trialExpiry - now;
        const trialDaysLeft = Math.max(0, Math.ceil(delta / (1000 * 60 * 60 * 24)));
        
        const updated = {
          ...mockSub,
          trial_active: trialActive,
          trial_days_left: trialDaysLeft,
          subscription_active: subActive,
          has_access: trialActive || subActive
        };
        
        setLocalData('mock_subscription', updated);
        return updated;
      }
    );
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
    return executeWithFallback(
      async () => {
        const response = await api.post('/subscription/detect-transaction', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
      },
      () => {
        return new Promise((resolve) => {
          setTimeout(() => {
            const randomUTR = Math.floor(100000000000 + Math.random() * 900000000000).toString();
            resolve({
              success: true,
              transaction_id: randomUTR,
              detail: "Simulated UTR detection (Local Fallback)"
            });
          }, 1000);
        });
      }
    );
  },

  getPlans: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/subscription/plans');
        // Cache live DB plans under the shared key so offline mode stays in sync
        setLocalData('mock_plans', response.data);
        setLocalData('mock_plans_public', response.data);
        return response.data;
      },
      () => {
        // Use admin-created mock plans if available, otherwise fall back to defaults
        const adminPlans = getLocalData('mock_plans', []);
        if (adminPlans.length > 0) {
          return adminPlans;
        }
        const defaults = [
          { id: 1, plan_name: '15 Days',  price: 299,  duration_days: 15,  description: 'Perfect for quick audit reports and campaign testing.' },
          { id: 2, plan_name: '1 Month',  price: 499,  duration_days: 30,  description: 'Standard monthly access to refine your marketing systems.' },
          { id: 3, plan_name: '3 Months', price: 1299, duration_days: 90,  description: 'Medium-term plan for growing businesses and active audits.' },
          { id: 4, plan_name: '6 Months', price: 2299, duration_days: 180, description: 'Semi-annual package for established marketing consultants.' },
          { id: 5, plan_name: '1 Year',   price: 3999, duration_days: 365, description: 'Ultimate yearly pass with full executive privileges.' },
        ];
        setLocalData('mock_plans', defaults);
        setLocalData('mock_plans_public', defaults);
        return defaults;
      }
    );
  },

  getQRUrl: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/subscription/qr-url');
        const url = response.data.qr_image_url;
        if (url) localStorage.setItem('mock_qr_url', url);
        return url || null;
      },
      () => {
        const cached = localStorage.getItem('mock_qr_url');
        return cached || null;
      }
    );
  },
};


export const adminAPI = {
  getStats: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/admin/stats');
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        const audits = getLocalData('mock_audits', []);
        const socials = getLocalData('mock_social_analyses', []);
        const reports = getLocalData('mock_reports', []);

        const websiteAudits = audits.length;
        const socialAudits = socials.length;
        const totalAudits = websiteAudits + socialAudits;

        const avgSeo = audits.length ? Math.round(audits.reduce((acc, curr) => acc + curr.seo_score, 0) / audits.length) : 0;
        const avgHealth = audits.length ? Math.round(audits.reduce((acc, curr) => acc + curr.health_score, 0) / audits.length) : 0;
        const avgSocial = socials.length ? Math.round(socials.reduce((acc, curr) => acc + curr.social_score, 0) / socials.length) : 0;

        return {
          total_users: users.length,
          active_users: users.length,
          new_registrations: users.length,
          total_audits: totalAudits,
          seo_audits: websiteAudits,
          website_audits: websiteAudits,
          social_media_audits: socialAudits,
          total_reports: reports.length,
          avg_seo_score: avgSeo,
          avg_health_score: avgHealth,
          avg_social_score: avgSocial,
          registration_history: [
            { month: "Jan", count: 0 },
            { month: "Feb", count: 0 },
            { month: "Mar", count: 0 },
            { month: "Apr", count: 0 },
            { month: "May", count: 0 },
            { month: "Jun", count: users.length }
          ]
        };
      }
    );
  },

  getUsers: async (params = {}) => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/admin/users', { params });
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        const audits = getLocalData('mock_audits', []);
        const reports = getLocalData('mock_reports', []);
        const profiles = getLocalData('mock_profiles', []);
        
        let result = users.map(u => ({
          id: u.id,
          email: u.email,
          full_name: u.full_name,
          role: u.role === 'admin' || u.email.includes('admin') ? 'admin' : 'user',
          created_at: u.created_at || new Date().toISOString(),
          audits_count: audits.length,
          reports_count: reports.length,
          business_profiles: profiles,
          access: {
            has_access: true,
            trial_active: true,
            trial_days_left: 3,
            subscription_active: false,
            subscription_plan: null,
            role: u.role === 'admin' || u.email.includes('admin') ? 'admin' : 'user'
          },
          payments: []
        }));

        if (params.search) {
          const s = params.search.toLowerCase();
          result = result.filter(u => u.full_name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s));
        }
        if (params.role) {
          result = result.filter(u => u.role === params.role);
        }
        return result;
      }
    );
  },

  previewUser: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.get(`/admin/users/${id}`);
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        const matched = users.find(u => u.id === id || u.id === parseInt(id));
        if (!matched) throw { response: { status: 404 } };
        return {
          id: matched.id,
          email: matched.email,
          full_name: matched.full_name,
          role: matched.role,
          created_at: matched.created_at || new Date().toISOString(),
          audits_count: 2,
          reports_count: 1,
          business_profiles: getLocalData('mock_profiles', []),
          access: {
            has_access: true,
            trial_active: true,
            trial_days_left: 3,
            subscription_active: false,
            subscription_plan: null,
            role: matched.role
          },
          payments: []
        };
      }
    );
  },

  updateUser: async (id, updateData) => {
    return executeWithFallback(
      async () => {
        const response = await api.put(`/admin/users/${id}`, updateData);
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        const idx = users.findIndex(u => u.id === id || u.id === parseInt(id));
        if (idx === -1) throw { response: { status: 404 } };
        users[idx] = { ...users[idx], ...updateData };
        setLocalData('mock_users', users);
        return { ...users[idx], detail: "User updated successfully." };
      }
    );
  },

  deleteUser: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.delete(`/admin/users/${id}`);
        return response.data;
      },
      () => {
        const users = getLocalData('mock_users', []);
        const filtered = users.filter(u => u.id !== id && u.id !== parseInt(id));
        setLocalData('mock_users', filtered);
        return { message: 'User deleted successfully' };
      }
    );
  },

  getReports: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/admin/reports');
        return response.data;
      },
      () => {
        const reports = getLocalData('mock_reports', []);
        return reports.map(r => ({
          id: r.id,
          report_id: r.report_id,
          title: r.title,
          type: r.type,
          created_at: r.created_at,
          scores: r.scores,
          user_email: 'demo@marketerai.com'
        }));
      }
    );
  },

  deleteReport: async (id) => {
    return executeWithFallback(
      async () => {
        const response = await api.delete(`/admin/reports/${id}`);
        return response.data;
      },
      () => {
        const reports = getLocalData('mock_reports', []);
        const filtered = reports.filter(r => r.id !== id && r.id !== parseInt(id));
        setLocalData('mock_reports', filtered);
        return { message: 'Report deleted successfully' };
      }
    );
  },

  // ── Plan Price Management ────────────────────────────────────────────────
  getPlans: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/admin/plans');
        return response.data;
      },
      () => [
        { id: 1, plan_name: "15 Days",  price: 299,  duration_days: 15,  description: "Quick audit reports." },
        { id: 2, plan_name: "1 Month",  price: 499,  duration_days: 30,  description: "Standard monthly access." },
        { id: 3, plan_name: "3 Months", price: 1299, duration_days: 90,  description: "Medium-term plan." },
        { id: 4, plan_name: "6 Months", price: 2299, duration_days: 180, description: "Semi-annual package." },
        { id: 5, plan_name: "1 Year",   price: 3999, duration_days: 365, description: "Ultimate yearly pass." },
      ]
    );
  },

  createPlan: async (planData) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/admin/plans', planData);
        return response.data;
      },
      () => {
        const plans = getLocalData('mock_plans', []);
        const newPlan = { id: Date.now(), ...planData, updated_at: new Date().toISOString() };
        plans.push(newPlan);
        setLocalData('mock_plans', plans);
        return { ...newPlan, detail: 'Plan created successfully.' };
      }
    );
  },

  updatePlan: async (id, planData) => {
    return executeWithFallback(
      async () => {
        const response = await api.put(`/admin/plans/${id}`, planData);
        return response.data;
      },
      () => {
        const plans = getLocalData('mock_plans', []);
        const idx = plans.findIndex(p => p.id === id || p.id === parseInt(id));
        if (idx !== -1) {
          plans[idx] = { ...plans[idx], ...planData, updated_at: new Date().toISOString() };
          setLocalData('mock_plans', plans);
          return { ...plans[idx], detail: 'Plan updated successfully.' };
        }
        return { detail: 'Plan updated (local fallback).' };
      }
    );
  },

  deletePlan: async (id) => {
    return executeWithFallback(
      async () => {
        await api.delete(`/admin/plans/${id}`);
        return { detail: 'Plan deleted.' };
      },
      () => {
        const plans = getLocalData('mock_plans', []);
        setLocalData('mock_plans', plans.filter(p => p.id !== id && p.id !== parseInt(id)));
        return { detail: 'Plan deleted (local fallback).' };
      }
    );
  },

  uploadPlatformQR: async (formData) => {
    return executeWithFallback(
      async () => {
        const response = await api.post('/admin/platform-qr', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const qrUrl = response.data.qr_image_url || response.data.url || null;
        if (qrUrl) {
          localStorage.setItem('mock_qr_url', qrUrl);
        }
        return response.data;
      },
      () => {
        const url = '/uploads/platform_qr.png';
        localStorage.setItem('mock_qr_url', url);
        return { success: true, qr_image_url: url };
      }
    );
  },

  getQRUrl: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/admin/platform-qr');
        const url = response.data.qr_image_url;
        if (url) localStorage.setItem('mock_qr_url', url);
        return url || null;
      },
      () => localStorage.getItem('mock_qr_url') || null
    );
  },

  getPendingPayments: async () => {
    return executeWithFallback(
      async () => {
        const response = await api.get('/admin/payments/pending');
        return response.data;
      },
      () => []
    );
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

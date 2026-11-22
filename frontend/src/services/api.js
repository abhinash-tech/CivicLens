/**
 * CivicLens API Client
 * Interacts with backend API endpoints defined in docs/api-contract.md
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Helper to handle fetch responses and error extraction
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    ...options.headers,
  };

  // Add JWT Auth token if present
  const token = localStorage.getItem('civiclens_token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If body is NOT FormData, default to application/json
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = { message: await response.text() };
  }

  if (!response.ok) {
    // If unauthorized, clean up token
    if (response.status === 401) {
      localStorage.removeItem('civiclens_token');
      localStorage.removeItem('civiclens_admin');
    }
    const errorMessage = data?.message || data?.error || `Request failed with status ${response.status}`;
    const error = new Error(errorMessage);
    error.status = response.status;
    error.details = data?.details;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // System Health
  getHealth: () => request('/health'),
  getDbHealth: () => request('/health/db'),

  // Citizen Complaint Filing & Tracking
  submitComplaint: (formData) => {
    return request('/complaints', {
      method: 'POST',
      body: formData,
    });
  },

  trackComplaint: (code) => {
    return request(`/complaints/track/${encodeURIComponent(code)}`);
  },

  // Public Transparency
  getPublicStats: () => {
    return request('/public/stats');
  },

  getPublicRecent: (limit = 10) => {
    return request(`/public/recent?limit=${encodeURIComponent(limit)}`);
  },

  // Admin Authentication & Management
  adminLogin: ({ email, password }) => {
    return request('/admin/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  getAdminComplaints: (params = {}) => {
    const query = new URLSearchParams();
    if (params.status && params.status !== 'ALL') query.append('status', params.status);
    if (params.severity && params.severity !== 'ALL') query.append('severity', params.severity);
    if (params.department && params.department !== 'ALL') query.append('department', params.department);
    if (params.search) query.append('search', params.search);
    if (params.page) query.append('page', params.page);
    if (params.limit) query.append('limit', params.limit);

    const qs = query.toString();
    return request(`/admin/complaints${qs ? `?${qs}` : ''}`);
  },

  getAdminComplaintDetail: (id) => {
    return request(`/admin/complaints/${encodeURIComponent(id)}`);
  },

  updateComplaintStatus: (id, { status, adminNotes, reason }) => {
    return request(`/admin/complaints/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: { status, adminNotes, reason },
    });
  },
};

export default api;

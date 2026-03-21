import axios from 'axios';
import { auth } from '../firebase';

// In Vercel, serverless functions live at /api/*
// For local dev with `vercel dev`, this also works.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach Firebase ID Token to every request
api.interceptors.request.use(async (config) => {
  const currentUser = auth.currentUser;
  if (currentUser) {
    // getIdToken() automatically refreshes if expired
    const idToken = await currentUser.getIdToken();
    config.headers.Authorization = `Bearer ${idToken}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const matchesApi = {
  getAll: () => api.get('/matches'),
};

export const predictionsApi = {
  save: (data) => api.post('/predictions', data),
  getAll: () => api.get('/predictions'),
};

export const rankingApi = {
  get: () => api.get('/ranking'),
};

export default api;

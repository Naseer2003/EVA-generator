import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
});

// Attach JWT token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('eva_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const authApi = {
  register: (data: { email: string; password: string; firstName: string; lastName: string; tenantName?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/profile'),
};

// Datasets
export const datasetsApi = {
  upload: (file: File, name?: string) => {
    const form = new FormData();
    form.append('file', file, file.name);
    if (name) form.append('name', name);
    return api.post('/datasets/upload', form);
  },
  getAll: () => api.get('/datasets'),
  getById: (id: string) => api.get(`/datasets/${id}`),
  download: (id: string) => api.get(`/datasets/${id}/download`, { responseType: 'blob' }),
};

// EVA Runs
export const evaApi = {
  run: (payload: {
    datasetId: string;
    method?: string;
    confidenceLevel?: number;
    returnPeriods?: number[];
    nBootstrap?: number;
    totalPopulation?: number;
    originalThickness?: number;
    serviceStartDate?: string;
    inspectionDate?: string;
    minimumRequiredThickness?: number;
  }) => api.post('/eva/run', payload),
  getResults: (runId: string) => api.get(`/eva/${runId}/results`),
  getMyRuns: () => api.get('/eva/my-runs'),
};

// Assets
export const assetsApi = {
  getAll: () => api.get('/assets'),
  create: (data: { name: string; location?: string; material?: string }) => api.post('/assets', data),
};

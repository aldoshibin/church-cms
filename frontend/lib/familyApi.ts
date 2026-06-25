import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const familyApi = axios.create({ baseURL: API_URL, headers: { 'Content-Type': 'application/json' } });

familyApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('family_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

familyApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('family_access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getFamilyId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('family_id');
}

export function getFamilyName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('family_name') || '';
}

export function getFamilyToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('family_access_token');
}

export function clearFamilySession() {
  localStorage.removeItem('family_access_token');
  localStorage.removeItem('family_refresh_token');
  localStorage.removeItem('family_id');
  localStorage.removeItem('family_name');
  localStorage.removeItem('family_user');
}
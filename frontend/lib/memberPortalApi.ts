import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export const memberPortalApi = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

memberPortalApi.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('member_access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

memberPortalApi.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('member_access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function getMemberPortalId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('member_id');
}
export function getMemberPortalName(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem('member_name') || '';
}
export function getMemberPortalToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('member_access_token');
}
export function clearMemberPortalSession() {
  localStorage.removeItem('member_access_token');
  localStorage.removeItem('member_refresh_token');
  localStorage.removeItem('member_id');
  localStorage.removeItem('member_name');
  localStorage.removeItem('member_user');
}

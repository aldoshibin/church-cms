'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const adminToken = getToken();
    const familyToken = typeof window !== 'undefined' ? localStorage.getItem('family_access_token') : null;
    if (adminToken) router.push('/dashboard');
    else if (familyToken) router.push('/family/dashboard');
    else router.push('/login');
  }, []);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

'use client';
import Sidebar from './Sidebar';
import Header from './Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export default function DashboardLayout({ children, title, subtitle }: Props) {
  const router   = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace('/login');
    } else {
      setReady(true);
    }
  }, []);

  // Don't render children until auth confirmed — prevents flash / overlay issues
  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-400">
          <div className="w-8 h-8 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <span className="text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div style={{ marginLeft: 260 }}>
        <Header title={title} subtitle={subtitle} />
        <main style={{ paddingTop: 56 }}>
          <div className="p-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
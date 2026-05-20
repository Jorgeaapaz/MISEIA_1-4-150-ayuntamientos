import { useGlobal } from '@/context/GlobalContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useAuth() {
  const { user, token, loading } = useGlobal();
  return { user, token, loading, isAuthenticated: !!user };
}

export function useRequireAuth(role?: 'administrado' | 'funcionario') {
  const { user, loading } = useGlobal();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (role && user.role !== role) {
      router.replace('/dashboard');
    }
  }, [user, loading, role, router]);

  return { user, loading };
}

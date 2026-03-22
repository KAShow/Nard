import { useMemo } from 'react';
import { useAuth as useSupabaseAuth } from '@/template';
import { User } from '@/types';

export function useAuth() {
  const auth = useSupabaseAuth();

  // Memoize user object to avoid creating a new reference every render
  const user: User | null = useMemo(() => {
    if (!auth.user) return null;
    return {
      id: auth.user.id,
      name: auth.user.username || auth.user.email?.split('@')[0] || 'مستخدم',
      points: 0,
      badges: [],
    };
  }, [auth.user?.id, auth.user?.username, auth.user?.email]);

  return {
    user,
    loading: auth.loading,
    operationLoading: auth.operationLoading,
    sendOTP: auth.sendOTP,
    verifyOTPAndLogin: auth.verifyOTPAndLogin,
    signUpWithPassword: auth.signUpWithPassword,
    signInWithPassword: auth.signInWithPassword,
    logout: auth.logout,
  };
}

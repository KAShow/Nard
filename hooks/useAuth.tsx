import { useAuth as useSupabaseAuth } from '@/template';
import { User } from '@/types';

export function useAuth() {
  const auth = useSupabaseAuth();

  // Transform template auth user to our app's User type
  const user: User | null = auth.user
    ? {
        id: auth.user.id,
        name: auth.user.username || auth.user.email?.split('@')[0] || 'مستخدم',
        points: 0, // Will be loaded from user_profiles
        badges: [], // Will be loaded from user_profiles
      }
    : null;

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

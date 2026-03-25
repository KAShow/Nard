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

  const deleteAccount = async (): Promise<{ error: string | null }> => {
    if (!auth.user) {
      return { error: 'لا يوجد مستخدم مسجل' };
    }

    try {
      // Use the underlying Supabase client to call the delete function
      const { getSupabaseClient } = require('@/template');
      const supabase = getSupabaseClient();
      
      // Call the RPC function to delete the user's account
      const { error } = await supabase.rpc('delete_own_account');
      
      if (error) {
        return { error: error.message };
      }

      // Sign out locally
      await auth.logout();
      
      return { error: null };
    } catch (error: any) {
      return { error: error.message || 'حدث خطأ أثناء حذف الحساب' };
    }
  };

  return {
    user,
    loading: auth.loading,
    operationLoading: auth.operationLoading,
    sendOTP: auth.sendOTP,
    verifyOTPAndLogin: auth.verifyOTPAndLogin,
    signUpWithPassword: auth.signUpWithPassword,
    signInWithPassword: auth.signInWithPassword,
    logout: auth.logout,
    deleteAccount,
  };
}

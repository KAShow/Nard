import React, { createContext, ReactNode } from 'react';
import { AuthProvider as SupabaseAuthProvider } from '@/template';

// Re-export Supabase AuthProvider as AuthProvider
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

// For backwards compatibility, export a context (will use template's internally)
export const AuthContext = createContext(undefined);

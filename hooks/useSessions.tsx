import { useContext } from 'react';
import { SessionContext } from '@/contexts/SessionContext';

export function useSessions() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessions must be used within SessionProvider');
  }
  return context;
}

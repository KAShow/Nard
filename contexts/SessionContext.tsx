import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, Attendee } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import * as supabaseService from '@/services/supabaseService';

interface SessionContextType {
  sessions: Session[];
  isLoading: boolean;
  createSession: (session: Omit<Session, 'id' | 'attendees' | 'ratings' | 'createdAt'>) => Promise<void>;
  joinSession: (sessionId: string, attendee: Attendee) => Promise<void>;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
  rateSession: (sessionId: string, userId: string, emoji: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.fetchSessions();
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load sessions when user changes (use user.id for stable reference)
  useEffect(() => {
    if (user) {
      loadSessions();
    } else {
      setSessions([]);
      setIsLoading(false);
    }
  }, [user?.id]);

  const createSession = async (sessionData: Omit<Session, 'id' | 'attendees' | 'ratings' | 'createdAt'>) => {
    try {
      await supabaseService.createSession(sessionData);
      await loadSessions(); // Refresh list
    } catch (error) {
      console.error('Failed to create session:', error);
      throw error;
    }
  };

  const joinSession = async (sessionId: string, attendee: Attendee) => {
    try {
      await supabaseService.addAttendee(sessionId, attendee);
      await loadSessions(); // Refresh list
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  };

  const leaveSession = async (sessionId: string, userId: string) => {
    try {
      await supabaseService.removeAttendee(sessionId, userId);
      await loadSessions(); // Refresh list
    } catch (error) {
      console.error('Failed to leave session:', error);
      throw error;
    }
  };

  const rateSession = async (sessionId: string, userId: string, emoji: string) => {
    try {
      await supabaseService.addOrUpdateRating(sessionId, userId, emoji);
      await loadSessions(); // Refresh list
    } catch (error) {
      console.error('Failed to rate session:', error);
      throw error;
    }
  };

  const refreshSessions = async () => {
    await loadSessions();
  };

  return (
    <SessionContext.Provider
      value={{
        sessions,
        isLoading,
        createSession,
        joinSession,
        leaveSession,
        rateSession,
        refreshSessions,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

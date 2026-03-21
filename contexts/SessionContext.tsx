import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, Attendee } from '@/types';
import { storageService } from '@/services/storageService';

interface SessionContextType {
  sessions: Session[];
  isLoading: boolean;
  createSession: (session: Omit<Session, 'id' | 'attendees' | 'ratings' | 'createdAt'>) => Promise<void>;
  updateSession: (id: string, updates: Partial<Session>) => Promise<void>;
  joinSession: (sessionId: string, attendee: Attendee) => Promise<void>;
  leaveSession: (sessionId: string, userId: string) => Promise<void>;
  rateSession: (sessionId: string, userId: string, emoji: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

export const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const savedSessions = await storageService.getSessions();
      setSessions(savedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (sessionData: Omit<Session, 'id' | 'attendees' | 'ratings' | 'createdAt'>) => {
    const newSession: Session = {
      ...sessionData,
      id: Date.now().toString(),
      attendees: [],
      ratings: [],
      createdAt: new Date().toISOString(),
    };
    const updatedSessions = [...sessions, newSession];
    await storageService.saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const updateSession = async (id: string, updates: Partial<Session>) => {
    const updatedSessions = sessions.map(session =>
      session.id === id ? { ...session, ...updates } : session
    );
    await storageService.saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const joinSession = async (sessionId: string, attendee: Attendee) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        const existingIndex = session.attendees.findIndex(a => a.userId === attendee.userId);
        if (existingIndex >= 0) {
          const updatedAttendees = [...session.attendees];
          updatedAttendees[existingIndex] = attendee;
          return { ...session, attendees: updatedAttendees };
        } else {
          return { ...session, attendees: [...session.attendees, attendee] };
        }
      }
      return session;
    });
    await storageService.saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const leaveSession = async (sessionId: string, userId: string) => {
    const updatedSessions = sessions.map(session =>
      session.id === sessionId
        ? { ...session, attendees: session.attendees.filter(a => a.userId !== userId) }
        : session
    );
    await storageService.saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const rateSession = async (sessionId: string, userId: string, emoji: string) => {
    const updatedSessions = sessions.map(session => {
      if (session.id === sessionId) {
        const existingRatingIndex = session.ratings.findIndex(r => r.userId === userId);
        let updatedRatings = [...session.ratings];
        
        if (existingRatingIndex >= 0) {
          updatedRatings[existingRatingIndex] = { userId, emoji };
        } else {
          updatedRatings.push({ userId, emoji });
        }
        
        return { ...session, ratings: updatedRatings };
      }
      return session;
    });
    await storageService.saveSessions(updatedSessions);
    setSessions(updatedSessions);
  };

  const refreshSessions = async () => {
    await loadSessions();
  };

  return (
    <SessionContext.Provider value={{
      sessions,
      isLoading,
      createSession,
      updateSession,
      joinSession,
      leaveSession,
      rateSession,
      refreshSessions,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

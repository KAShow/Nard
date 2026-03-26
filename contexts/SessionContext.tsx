import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { Session, Attendee, FoodOrder, GameVote } from '@/types';
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
  startSession: (sessionId: string) => Promise<void>;
  endSession: (sessionId: string, durationSeconds: number) => Promise<void>;
  addFoodOrder: (sessionId: string, userId: string, userName: string, orderText: string) => Promise<void>;
  updateFoodOrder: (orderId: string, orderText: string) => Promise<void>;
  deleteFoodOrder: (orderId: string) => Promise<void>;
  addGameVote: (sessionId: string, userId: string, gameName: string) => Promise<void>;
  removeGameVote: (sessionId: string, userId: string, gameName: string) => Promise<void>;
  getUserVoteCount: (sessionId: string, userId: string) => Promise<number>;
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

  const startSession = async (sessionId: string) => {
    try {
      await supabaseService.startSession(sessionId);
      await loadSessions();
    } catch (error) {
      console.error('Context: Failed to start session:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      throw new Error(errorMessage);
    }
  };

  const endSession = async (sessionId: string, durationSeconds: number) => {
    try {
      await supabaseService.endSession(sessionId, durationSeconds);
      await loadSessions();
    } catch (error) {
      console.error('Context: Failed to end session:', error);
      const errorMessage = error instanceof Error ? error.message : 'خطأ غير معروف';
      throw new Error(errorMessage);
    }
  };

  const addFoodOrder = async (sessionId: string, userId: string, userName: string, orderText: string) => {
    try {
      await supabaseService.addFoodOrder(sessionId, userId, userName, orderText);
      await loadSessions();
    } catch (error) {
      console.error('Failed to add food order:', error);
      throw error;
    }
  };

  const updateFoodOrder = async (orderId: string, orderText: string) => {
    try {
      await supabaseService.updateFoodOrder(orderId, orderText);
      await loadSessions();
    } catch (error) {
      console.error('Failed to update food order:', error);
      throw error;
    }
  };

  const deleteFoodOrder = async (orderId: string) => {
    try {
      await supabaseService.deleteFoodOrder(orderId);
      await loadSessions();
    } catch (error) {
      console.error('Failed to delete food order:', error);
      throw error;
    }
  };

  const addGameVote = async (sessionId: string, userId: string, gameName: string) => {
    try {
      await supabaseService.addGameVote(sessionId, userId, gameName);
      await loadSessions();
    } catch (error) {
      console.error('Failed to add game vote:', error);
      throw error;
    }
  };

  const removeGameVote = async (sessionId: string, userId: string, gameName: string) => {
    try {
      await supabaseService.removeGameVote(sessionId, userId, gameName);
      await loadSessions();
    } catch (error) {
      console.error('Failed to remove game vote:', error);
      throw error;
    }
  };

  const getUserVoteCount = async (sessionId: string, userId: string) => {
    return await supabaseService.getUserVoteCount(sessionId, userId);
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
        startSession,
        endSession,
        addFoodOrder,
        updateFoodOrder,
        deleteFoodOrder,
        addGameVote,
        removeGameVote,
        getUserVoteCount,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

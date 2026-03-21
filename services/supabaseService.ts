import { getSupabaseClient } from '@/template';
import { Session, Attendee, SessionRating } from '@/types';

const supabase = getSupabaseClient();

// ==================== SESSIONS ====================

export async function fetchSessions() {
  const { data: sessionsData, error: sessionsError } = await supabase
    .from('sessions')
    .select('*')
    .order('date', { ascending: true });

  if (sessionsError) {
    console.error('Error fetching sessions:', sessionsError);
    return [];
  }

  if (!sessionsData || sessionsData.length === 0) {
    return [];
  }

  // Fetch attendees for all sessions
  const sessionIds = sessionsData.map(s => s.id);
  const { data: attendeesData } = await supabase
    .from('attendees')
    .select('*')
    .in('session_id', sessionIds);

  // Fetch ratings for all sessions
  const { data: ratingsData } = await supabase
    .from('session_ratings')
    .select('*')
    .in('session_id', sessionIds);

  // Combine data
  const sessions: Session[] = sessionsData.map(session => ({
    id: session.id,
    hostId: session.host_id,
    hostName: session.host_name,
    title: session.title,
    description: session.description || '',
    date: session.date,
    time: session.time,
    location: session.location,
    locationUrl: session.location_url,
    maxPlayers: session.max_players,
    status: session.status,
    createdAt: session.created_at,
    attendees: (attendeesData || [])
      .filter(a => a.session_id === session.id)
      .map(a => ({
        userId: a.user_id,
        userName: a.user_name,
        gameBrought: a.game_brought,
        snackBrought: a.snack_brought,
        joinedAt: a.joined_at,
      })),
    ratings: (ratingsData || [])
      .filter(r => r.session_id === session.id)
      .map(r => ({
        userId: r.user_id,
        emoji: r.emoji,
      })),
  }));

  return sessions;
}

export async function createSession(session: Omit<Session, 'id' | 'attendees' | 'ratings' | 'createdAt'>) {
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      host_id: session.hostId,
      host_name: session.hostName,
      title: session.title,
      description: session.description,
      date: session.date,
      time: session.time,
      location: session.location,
      location_url: session.locationUrl,
      max_players: session.maxPlayers,
      status: session.status,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
    throw error;
  }

  return data;
}

export async function updateSessionStatus(sessionId: string, status: 'upcoming' | 'completed') {
  const { error } = await supabase
    .from('sessions')
    .update({ status })
    .eq('id', sessionId);

  if (error) {
    console.error('Error updating session status:', error);
    throw error;
  }
}

// ==================== ATTENDEES ====================

export async function addAttendee(sessionId: string, attendee: Attendee) {
  const { error } = await supabase
    .from('attendees')
    .insert({
      session_id: sessionId,
      user_id: attendee.userId,
      user_name: attendee.userName,
      game_brought: attendee.gameBrought,
      snack_brought: attendee.snackBrought,
    });

  if (error) {
    console.error('Error adding attendee:', error);
    throw error;
  }
}

export async function removeAttendee(sessionId: string, userId: string) {
  const { error } = await supabase
    .from('attendees')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error removing attendee:', error);
    throw error;
  }
}

// ==================== RATINGS ====================

export async function addOrUpdateRating(sessionId: string, userId: string, emoji: string) {
  const { error } = await supabase
    .from('session_ratings')
    .upsert({
      session_id: sessionId,
      user_id: userId,
      emoji,
    }, {
      onConflict: 'session_id,user_id',
    });

  if (error) {
    console.error('Error adding/updating rating:', error);
    throw error;
  }
}

// ==================== USER PROFILES ====================

export async function updateUserProfile(userId: string, updates: { points?: number; badges?: string[] }) {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
}

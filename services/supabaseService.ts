import { getSupabaseClient } from '@/template';
import { Session, Attendee, SessionRating, FoodOrder, GameVote, GameVoteResult } from '@/types';

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

  // Fetch food orders for all sessions
  const { data: foodOrdersData } = await supabase
    .from('food_orders')
    .select('*')
    .in('session_id', sessionIds)
    .order('created_at', { ascending: true });

  // Fetch game votes for all sessions
  const { data: gameVotesData } = await supabase
    .from('game_votes')
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
    startedAt: session.started_at,
    endedAt: session.ended_at,
    durationSeconds: session.duration_seconds,
    foodOrders: (foodOrdersData || [])
      .filter(f => f.session_id === session.id)
      .map(f => ({
        id: f.id,
        sessionId: f.session_id,
        userId: f.user_id,
        userName: f.user_name,
        orderText: f.order_text,
        createdAt: f.created_at,
        updatedAt: f.updated_at,
      })),
    gameVotes: (gameVotesData || [])
      .filter(v => v.session_id === session.id)
      .map(v => ({
        sessionId: v.session_id,
        userId: v.user_id,
        gameName: v.game_name,
        createdAt: v.created_at,
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

// ==================== SESSION CONTROL ====================

export async function startSession(sessionId: string) {
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'ongoing',
      started_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error starting session:', error);
    throw error;
  }
}

export async function endSession(sessionId: string, durationSeconds: number) {
  const { error } = await supabase
    .from('sessions')
    .update({
      status: 'completed',
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error ending session:', error);
    throw error;
  }
}

// ==================== FOOD ORDERS ====================

export async function addFoodOrder(sessionId: string, userId: string, userName: string, orderText: string) {
  const { error } = await supabase
    .from('food_orders')
    .insert({
      session_id: sessionId,
      user_id: userId,
      user_name: userName,
      order_text: orderText,
    });

  if (error) {
    console.error('Error adding food order:', error);
    throw error;
  }

  // Update user's last food order
  await supabase
    .from('user_profiles')
    .update({ last_food_order: orderText })
    .eq('id', userId);
}

export async function updateFoodOrder(orderId: string, orderText: string) {
  const { error } = await supabase
    .from('food_orders')
    .update({ order_text: orderText })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating food order:', error);
    throw error;
  }
}

export async function deleteFoodOrder(orderId: string) {
  const { error } = await supabase
    .from('food_orders')
    .delete()
    .eq('id', orderId);

  if (error) {
    console.error('Error deleting food order:', error);
    throw error;
  }
}

// ==================== GAME VOTES ====================

export async function addGameVote(sessionId: string, userId: string, gameName: string) {
  const { error } = await supabase
    .from('game_votes')
    .insert({
      session_id: sessionId,
      user_id: userId,
      game_name: gameName,
    });

  if (error) {
    console.error('Error adding game vote:', error);
    throw error;
  }
}

export async function removeGameVote(sessionId: string, userId: string, gameName: string) {
  const { error } = await supabase
    .from('game_votes')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId)
    .eq('game_name', gameName);

  if (error) {
    console.error('Error removing game vote:', error);
    throw error;
  }
}

export async function getUserVoteCount(sessionId: string, userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('game_votes')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error getting vote count:', error);
    return 0;
  }

  return count || 0;
}

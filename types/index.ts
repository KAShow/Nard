export interface User {
  id: string;
  name: string;
  avatar?: string;
  points: number;
  badges: Badge[];
}

export interface Session {
  id: string;
  hostId: string;
  hostName: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  locationUrl?: string;
  maxPlayers: number;
  attendees: Attendee[];
  ratings: SessionRating[];
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt: string;
}

export interface Attendee {
  userId: string;
  userName: string;
  gameBrought?: string;
  snackBrought?: string;
  joinedAt: string;
}

export interface SessionRating {
  userId: string;
  emoji: string;
}

export type Badge = 
  | 'king'          // ملك البورد جيمز
  | 'provider'      // راعي الواجب
  | 'savior'        // المنقذ
  | 'veteran';      // محترف الجلسات

export interface BadgeInfo {
  id: Badge;
  name: string;
  emoji: string;
  description: string;
}

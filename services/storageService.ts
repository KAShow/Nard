import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Session } from '@/types';

const STORAGE_KEYS = {
  USER: '@nard_user',
  SESSIONS: '@nard_sessions',
};

export const storageService = {
  // User operations
  async saveUser(user: User): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },

  async getUser(): Promise<User | null> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER);
    return data ? JSON.parse(data) : null;
  },

  async clearUser(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Sessions operations
  async saveSessions(sessions: Session[]): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  },

  async getSessions(): Promise<Session[]> {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  async clearSessions(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
  },

  async clearAll(): Promise<void> {
    await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.SESSIONS]);
  },
};

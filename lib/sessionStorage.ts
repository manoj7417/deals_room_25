import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = 'deals_room_user_session';

export interface UserSession {
  email: string;
  name?: string;
  userId?: string;
  loginTime: string;
}

export const sessionStorage = {
  // Save user session
  saveSession: async (session: UserSession): Promise<boolean> => {
    try {
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));
      // Also set global variable for backward compatibility
      global.currentUserEmail = session.email;
      console.log('Session saved successfully:', session.email);
      return true;
    } catch (error) {
      console.error('Error saving session:', error);
      return false;
    }
  },

  // Get current session
  getSession: async (): Promise<UserSession | null> => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const session = JSON.parse(sessionData) as UserSession;
        // Set global variable for backward compatibility
        global.currentUserEmail = session.email;
        console.log('Session loaded successfully:', session.email);
        return session;
      }
      return null;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  },

  // Clear session
  clearSession: async (): Promise<boolean> => {
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
      // Clear global variable
      global.currentUserEmail = undefined;
      console.log('Session cleared successfully');
      return true;
    } catch (error) {
      console.error('Error clearing session:', error);
      return false;
    }
  },

  // Check if session exists
  hasSession: async (): Promise<boolean> => {
    try {
      const session = await AsyncStorage.getItem(SESSION_KEY);
      return session !== null;
    } catch (error) {
      console.error('Error checking session:', error);
      return false;
    }
  },

  // Update session data
  updateSession: async (updates: Partial<UserSession>): Promise<boolean> => {
    try {
      const currentSession = await sessionStorage.getSession();
      if (currentSession) {
        const updatedSession = { ...currentSession, ...updates };
        return await sessionStorage.saveSession(updatedSession);
      }
      return false;
    } catch (error) {
      console.error('Error updating session:', error);
      return false;
    }
  }
}; 

import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: 'cinetaste',
});

export const authService = {
  signInWithGoogle: async () => {
    try {
      const request = new AuthSession.AuthRequest({
        clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '',
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      });

      if (result.type === 'success') {
        const { code } = result.params;
        
        // Exchange code for token with your backend
        const response = await fetch(`${API_BASE_URL}/auth/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        const data = await response.json();
        
        if (response.ok) {
          await AsyncStorage.setItem('authSession', JSON.stringify(data));
          return data;
        } else {
          throw new Error(data.error || 'Authentication failed');
        }
      }
      
      throw new Error('Authentication was cancelled');
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await AsyncStorage.removeItem('authSession');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  getStoredSession: async () => {
    try {
      const sessionString = await AsyncStorage.getItem('authSession');
      return sessionString ? JSON.parse(sessionString) : null;
    } catch (error) {
      console.error('Get stored session error:', error);
      return null;
    }
  },
};

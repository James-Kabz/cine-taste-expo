import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthSession as AuthSessionType } from '../types';

WebBrowser.maybeCompleteAuthSession();

const googleClientId = Constants.expoConfig?.extra?.googleWebClientId;

export const authService = {
  // Google OAuth with Expo AuthSession
  signInWithGoogle: async (): Promise<AuthSessionType> => {
    try {
      const redirectUri = AuthSession.makeRedirectUri({
        // useProxy: true,
      });

      const request = new AuthSession.AuthRequest({
        clientId: googleClientId!,
        scopes: ['openid', 'profile', 'email'],
        redirectUri,
        responseType: AuthSession.ResponseType.Code,
        extraParams: {},
      });

      const result = await request.promptAsync({
        authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        // useProxy: true,
      });

      if (result.type === 'success') {
        // Exchange code for tokens
        const tokenResult = await AuthSession.exchangeCodeAsync(
          {
            clientId: googleClientId!,
            code: result.params.code,
            redirectUri,
            extraParams: {},
          },
          {
            tokenEndpoint: 'https://oauth2.googleapis.com/token',
          }
        );

        // Get user info from Google
        const userInfoResponse = await fetch(
          `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResult.accessToken}`
        );
        const userInfo = await userInfoResponse.json();

        // Send to your backend for session creation
        const response = await fetch(`${Constants.expoConfig?.extra?.apiUrl}/auth/signin/google`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            accessToken: tokenResult.accessToken,
            userInfo,
          }),
        });

        const sessionData = await response.json();
        
        const authSession: AuthSessionType = {
          user: {
            id: userInfo.id,
            name: userInfo.name,
            email: userInfo.email,
            image: userInfo.picture,
          },
          token: sessionData.token,
        };

        await AsyncStorage.setItem('authSession', JSON.stringify(authSession));
        return authSession;
      }

      throw new Error('Authentication cancelled');
    } catch (error) {
      throw error;
    }
  },

  // Sign Out
  signOut: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem('authSession');
    } catch (error) {
      throw error;
    }
  },

  // Get stored session
  getStoredSession: async (): Promise<AuthSessionType | null> => {
    try {
      const sessionString = await AsyncStorage.getItem('authSession');
      return sessionString ? JSON.parse(sessionString) : null;
    } catch (error) {
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async (): Promise<boolean> => {
    const session = await authService.getStoredSession();
    return !!session?.token;
  },
};

/**
 * Simple React Context + useReducer auth state store.
 *
 * Tokens are persisted to expo-secure-store so they survive app restarts.
 * The ApiClient singleton is updated whenever the access token changes.
 */
import * as React from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
import { authApi } from '../api/auth';
import type { UserProfile } from '../types/api';

const ACCESS_TOKEN_KEY = 'trustnest_access_token';
const REFRESH_TOKEN_KEY = 'trustnest_refresh_token';

// ─── State ───────────────────────────────────────────────────────────────────

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
}

type AuthAction =
  | { type: 'RESTORE_TOKEN'; accessToken: string | null; refreshToken: string | null }
  | { type: 'SIGN_IN'; accessToken: string; refreshToken: string }
  | { type: 'SIGN_OUT' }
  | { type: 'SET_USER'; user: UserProfile };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        isLoading: false,
        isAuthenticated: !!action.accessToken,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
      };
    case 'SIGN_IN':
      return {
        ...state,
        isAuthenticated: true,
        accessToken: action.accessToken,
        refreshToken: action.refreshToken,
      };
    case 'SIGN_OUT':
      return {
        ...state,
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        user: null,
      };
    case 'SET_USER':
      return { ...state, user: action.user };
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

export interface AuthContextValue {
  state: AuthState;
  signIn: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshAccessToken: () => Promise<boolean>;
  setUser: (user: UserProfile) => void;
}

export const AuthContext = React.createContext<AuthContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [state, dispatch] = React.useReducer(authReducer, {
    isLoading: true,
    isAuthenticated: false,
    accessToken: null,
    refreshToken: null,
    user: null,
  });

  // Restore tokens from secure store on mount
  React.useEffect(() => {
    void (async () => {
      try {
        const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
        const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
        if (accessToken) apiClient.setAccessToken(accessToken);
        dispatch({ type: 'RESTORE_TOKEN', accessToken, refreshToken });
      } catch {
        dispatch({ type: 'RESTORE_TOKEN', accessToken: null, refreshToken: null });
      }
    })();
  }, []);

  const signIn = async (accessToken: string, refreshToken: string): Promise<void> => {
    await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    apiClient.setAccessToken(accessToken);
    dispatch({ type: 'SIGN_IN', accessToken, refreshToken });
  };

  const signOut = async (): Promise<void> => {
    await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    apiClient.setAccessToken(null);
    dispatch({ type: 'SIGN_OUT' });
  };

  const refreshAccessToken = async (): Promise<boolean> => {
    if (!state.refreshToken) return false;
    try {
      const tokens = await authApi.refresh(state.refreshToken);
      await signIn(tokens.accessToken, tokens.refreshToken);
      return true;
    } catch {
      await signOut();
      return false;
    }
  };

  const setUser = (user: UserProfile): void => {
    dispatch({ type: 'SET_USER', user });
  };

  const value: AuthContextValue = {
    state,
    signIn,
    signOut,
    refreshAccessToken,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

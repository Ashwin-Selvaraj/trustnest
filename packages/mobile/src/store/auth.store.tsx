/**
 * Simple React Context + useReducer auth state store.
 *
 * Tokens are persisted to expo-secure-store so they survive app restarts.
 * The ApiClient singleton is updated whenever the access token changes.
 */
import * as React from 'react';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../api/client';
import { authApi } from '../api/auth';
import type { UserProfile } from '../types/api';

const ACCESS_TOKEN_KEY = 'trustnest_access_token';
const REFRESH_TOKEN_KEY = 'trustnest_refresh_token';

interface WebStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function getWebStorage(): WebStorage | undefined {
  return (globalThis as { localStorage?: WebStorage }).localStorage;
}

// expo-secure-store has no web implementation (its web module is an empty
// stub), so fall back to localStorage there. Not encrypted-at-rest on web,
// but matches what SecureStore itself does under the hood on that platform.
const tokenStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') return getWebStorage()?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      getWebStorage()?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      getWebStorage()?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

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
        const accessToken = await tokenStorage.getItem(ACCESS_TOKEN_KEY);
        const refreshToken = await tokenStorage.getItem(REFRESH_TOKEN_KEY);
        if (accessToken) apiClient.setAccessToken(accessToken);
        dispatch({ type: 'RESTORE_TOKEN', accessToken, refreshToken });

        // Rehydrate the user profile — without this, role-gated UI has no
        // role after an app restart and misclassifies the session.
        if (accessToken) {
          try {
            const { usersApi } = await import('../api/users');
            const user = await usersApi.getMe();
            dispatch({ type: 'SET_USER', user });
          } catch {
            // token may be expired; screens handle a null user via guards
          }
        }
      } catch {
        dispatch({ type: 'RESTORE_TOKEN', accessToken: null, refreshToken: null });
      }
    })();
  }, []);

  const signIn = async (accessToken: string, refreshToken: string): Promise<void> => {
    await tokenStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await tokenStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    apiClient.setAccessToken(accessToken);
    dispatch({ type: 'SIGN_IN', accessToken, refreshToken });
  };

  const signOut = async (): Promise<void> => {
    await tokenStorage.deleteItem(ACCESS_TOKEN_KEY);
    await tokenStorage.deleteItem(REFRESH_TOKEN_KEY);
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

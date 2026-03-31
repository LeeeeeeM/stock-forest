import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';
const LEGACY_REFRESH_TOKEN_KEY = 'refreshToken';

function detectLegacyToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ?? '';
}

function detectLegacyRefreshToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(LEGACY_REFRESH_TOKEN_KEY) ?? '';
}

type AuthState = {
  accessToken: string;
  refreshToken: string;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setAccessToken: (token: string) => void;
  setRefreshToken: (token: string) => void;
  clearTokens: () => void;
  clearAccessToken: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: detectLegacyToken(),
      refreshToken: detectLegacyRefreshToken(),
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setAccessToken: (token) => set({ accessToken: token }),
      setRefreshToken: (token) => set({ refreshToken: token }),
      clearTokens: () => set({ accessToken: '', refreshToken: '' }),
      clearAccessToken: () => set({ accessToken: '', refreshToken: '' }),
    }),
    {
      name: 'auth_state',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const LEGACY_ACCESS_TOKEN_KEY = 'accessToken';

function detectLegacyToken() {
  if (typeof window === 'undefined') return '';
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY) ?? '';
}

type AuthState = {
  accessToken: string;
  setAccessToken: (token: string) => void;
  clearAccessToken: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: detectLegacyToken(),
      setAccessToken: (token) => set({ accessToken: token }),
      clearAccessToken: () => set({ accessToken: '' }),
    }),
    {
      name: 'auth_state',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

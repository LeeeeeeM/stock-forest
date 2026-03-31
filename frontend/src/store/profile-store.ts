import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ProfileData } from '@/lib/api';

type ProfileState = {
  data: ProfileData | null;
  setData: (data: ProfileData | null) => void;
  clearProfileCache: () => void;
};

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      data: null,
      setData: (data) => set({ data }),
      clearProfileCache: () => set({ data: null }),
    }),
    {
      name: 'profile_cache',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);


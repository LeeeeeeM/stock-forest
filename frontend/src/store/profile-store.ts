import { create } from 'zustand';
import type { ProfileData } from '@/lib/api';

type ProfileState = {
  data: ProfileData | null;
  setData: (data: ProfileData | null) => void;
  clearProfileCache: () => void;
};

export const useProfileStore = create<ProfileState>()((set) => ({
  data: null,
  setData: (data) => set({ data }),
  clearProfileCache: () => set({ data: null }),
}));

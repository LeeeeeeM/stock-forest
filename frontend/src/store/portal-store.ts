import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { WatchlistItem } from '@/lib/api';

type PortalProfile = {
  id: number;
  username: string;
  email: string;
};

type PortalState = {
  profile: PortalProfile | null;
  watchlist: WatchlistItem[];
  setProfile: (profile: PortalProfile | null) => void;
  setWatchlist: (items: WatchlistItem[]) => void;
  addWatchlistItem: (item: WatchlistItem) => void;
  removeWatchlistItem: (id: number) => void;
  clearPortalCache: () => void;
};

export const usePortalStore = create<PortalState>()(
  persist(
    (set) => ({
      profile: null,
      watchlist: [],
      setProfile: (profile) => set({ profile }),
      setWatchlist: (watchlist) => set({ watchlist }),
      addWatchlistItem: (item) =>
        set((state) => ({
          watchlist: [item, ...state.watchlist.filter((x) => x.id !== item.id)],
        })),
      removeWatchlistItem: (id) =>
        set((state) => ({
          watchlist: state.watchlist.filter((x) => x.id !== id),
        })),
      clearPortalCache: () => set({ profile: null, watchlist: [] }),
    }),
    {
      name: 'portal_cache',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);


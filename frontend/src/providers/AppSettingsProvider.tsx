import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { getLocale, setLocale, type Locale } from '@/i18n';

export type ThemeMode = 'dark' | 'light';

type AppSettingsState = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const THEME_MODE_KEY = 'app_theme_mode';
const SETTINGS_KEY = 'app_settings';

function detectDefaultTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem(THEME_MODE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const useAppSettingsStore = create<AppSettingsState>()(
  persist(
    (set) => ({
      locale: getLocale(),
      setLocale: (locale) => set({ locale }),
      themeMode: detectDefaultTheme(),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: SETTINGS_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
        themeMode: state.themeMode,
      }),
    },
  ),
);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const locale = useAppSettingsStore((s) => s.locale);
  const themeMode = useAppSettingsStore((s) => s.themeMode);

  useEffect(() => {
    setLocale(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    window.localStorage.setItem(THEME_MODE_KEY, themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  return <>{children}</>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSettings() {
  const locale = useAppSettingsStore((s) => s.locale);
  const setLocale = useAppSettingsStore((s) => s.setLocale);
  const themeMode = useAppSettingsStore((s) => s.themeMode);
  const setThemeMode = useAppSettingsStore((s) => s.setThemeMode);
  return { locale, setLocale, themeMode, setThemeMode };
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { getLocale, setLocale, type Locale } from '@/i18n';

export type ThemeMode = 'dark' | 'light';

type AppSettingsContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
};

const THEME_MODE_KEY = 'app_theme_mode';

const AppSettingsContext = createContext<AppSettingsContextValue | null>(null);

function detectDefaultTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'dark';
  const saved = window.localStorage.getItem(THEME_MODE_KEY);
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => getLocale());
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => detectDefaultTheme());

  useEffect(() => {
    setLocale(locale);
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(THEME_MODE_KEY, themeMode);
    document.documentElement.setAttribute('data-theme', themeMode);
  }, [themeMode]);

  const value = useMemo<AppSettingsContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      themeMode,
      setThemeMode: setThemeModeState,
    }),
    [locale, themeMode],
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error('useAppSettings must be used inside AppSettingsProvider');
  }
  return ctx;
}


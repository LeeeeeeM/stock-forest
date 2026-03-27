import { useCallback } from 'react';
import { tByLocale } from '@/i18n';
import { useAppSettings } from '@/providers/AppSettingsProvider';

export function useI18n() {
  const { locale } = useAppSettings();
  const t = useCallback((key: string) => tByLocale(locale, key), [locale]);
  return { locale, t };
}


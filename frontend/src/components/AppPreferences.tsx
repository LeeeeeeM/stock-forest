import { Segmented } from 'antd';
import { useAppSettings, type ThemeMode } from '@/providers/AppSettingsProvider';
import type { Locale } from '@/i18n';

export function AppPreferences() {
  const { locale, setLocale, themeMode, setThemeMode } = useAppSettings();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Segmented<Locale>
        size="small"
        value={locale}
        onChange={(value) => setLocale(value)}
        options={[
          { label: '中文', value: 'zh-CN' },
          { label: 'EN', value: 'en-US' },
        ]}
      />
      <Segmented<ThemeMode>
        size="small"
        value={themeMode}
        onChange={(value) => setThemeMode(value)}
        options={[
          { label: '☀️ 日间', value: 'light' },
          { label: '🌙 夜间', value: 'dark' },
        ]}
      />
    </div>
  );
}


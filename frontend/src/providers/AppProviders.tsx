import type { ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';
import { useAppSettings, AppSettingsProvider } from '@/providers/AppSettingsProvider';

function ThemedProvider({ children }: { children: ReactNode }) {
  const { themeMode } = useAppSettings();
  const isDark = themeMode === 'dark';
  const antdTheme = {
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorPrimary: '#34d399',
      colorSuccess: '#22c55e',
      colorError: '#ef4444',
      colorWarning: '#f59e0b',
      colorBgLayout: isDark ? '#020617' : '#f8fafc',
      colorBgContainer: isDark ? 'rgba(15, 23, 42, 0.78)' : '#ffffff',
      colorBgElevated: isDark ? 'rgba(30, 41, 59, 0.96)' : '#ffffff',
      colorBorder: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.14)',
      colorBorderSecondary: isDark ? 'rgba(148, 163, 184, 0.12)' : 'rgba(15, 23, 42, 0.08)',
      colorText: isDark ? '#f1f5f9' : '#0f172a',
      colorTextSecondary: isDark ? '#94a3b8' : '#334155',
      colorTextTertiary: isDark ? '#64748b' : '#64748b',
      borderRadius: 10,
      wireframe: false,
      fontFamily:
        'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    },
    components: {
      Button: {
        controlHeight: 40,
        paddingContentHS: 18,
        primaryShadow: 'none',
        defaultShadow: 'none',
      },
      Input: {
        activeShadow: isDark ? '0 0 0 2px rgba(52, 211, 153, 0.22)' : '0 0 0 2px rgba(16, 185, 129, 0.18)',
      },
    },
  };

  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppSettingsProvider>
      <ThemedProvider>{children}</ThemedProvider>
    </AppSettingsProvider>
  );
}

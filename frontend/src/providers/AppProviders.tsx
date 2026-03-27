import type { ReactNode } from 'react';
import { ConfigProvider, theme } from 'antd';

const antdTheme = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: '#34d399',
    colorSuccess: '#4ade80',
    colorError: '#fb7185',
    colorWarning: '#fbbf24',
    colorBgLayout: '#020617',
    colorBgContainer: 'rgba(15, 23, 42, 0.78)',
    colorBgElevated: 'rgba(30, 41, 59, 0.96)',
    colorBorder: 'rgba(148, 163, 184, 0.2)',
    colorBorderSecondary: 'rgba(148, 163, 184, 0.12)',
    colorText: '#f1f5f9',
    colorTextSecondary: '#94a3b8',
    colorTextTertiary: '#64748b',
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
      activeShadow: '0 0 0 2px rgba(52, 211, 153, 0.22)',
      hoverBg: '#0f172a',
    },
  },
};

export function AppProviders({ children }: { children: ReactNode }) {
  return <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>;
}

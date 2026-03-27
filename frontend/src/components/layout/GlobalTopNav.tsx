import { Select, Space, Switch, Typography } from 'antd';
import { type Locale } from '@/i18n';
import { useAppSettings } from '@/providers/AppSettingsProvider';

export function GlobalTopNav() {
  const { locale, setLocale, themeMode, setThemeMode } = useAppSettings();
  const isZh = locale === 'zh-CN';
  const isDark = themeMode === 'dark';

  return (
    <div className="lf-top-nav-wrap">
      <div className="lf-top-nav">
        <Typography.Text className="lf-top-nav-brand">Good Wood</Typography.Text>
        <Space size={12} wrap>
          <Space size={6}>
            <Typography.Text className="lf-top-nav-label">{isZh ? '语言' : 'Language'}</Typography.Text>
            <Select<Locale>
              value={locale}
              style={{ width: 110 }}
              onChange={(value) => setLocale(value)}
              options={[
                { value: 'zh-CN', label: '中文' },
                { value: 'en-US', label: 'English' },
              ]}
            />
          </Space>
          <Space size={6}>
            <Typography.Text className="lf-top-nav-label">{isZh ? '主题' : 'Theme'}</Typography.Text>
            <Switch
              checked={isDark}
              checkedChildren={isZh ? '夜间' : 'Dark'}
              unCheckedChildren={isZh ? '日间' : 'Light'}
              onChange={(checked) => setThemeMode(checked ? 'dark' : 'light')}
            />
          </Space>
        </Space>
      </div>
    </div>
  );
}


import { useEffect, useMemo } from 'react';
import { Button, message as antdMessage } from 'antd';
import { useNavigate } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useI18n } from '@/i18n/useI18n';
import { clearAccessToken, getAccessToken } from '@/lib/auth';
import { profile } from '@/lib/api';
import { resolveApiError } from '@/lib/error-message';
import { usePortalStore } from '@/store/portal-store';
import { useProfileStore } from '@/store/profile-store';

function formatLoginTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString();
}

export function ProfilePage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { t } = useI18n();
  const navigate = useNavigate();
  const token = getAccessToken();
  const data = useProfileStore((s) => s.data);
  const setData = useProfileStore((s) => s.setData);
  const clearProfileCache = useProfileStore((s) => s.clearProfileCache);
  const clearPortalCache = usePortalStore((s) => s.clearPortalCache);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    profile(token)
      .then(setData)
      .catch((err: unknown) => {
        messageApi.error(resolveApiError(err, 'error.profileLoadFailed'));
        clearAccessToken();
        clearProfileCache();
        clearPortalCache();
        navigate('/login', { replace: true });
      });
  }, [token, navigate, messageApi, setData, clearProfileCache, clearPortalCache]);

  const recentLogins = useMemo(() => data?.recentLogins ?? [], [data]);

  const onLogout = () => {
    clearAccessToken();
    clearProfileCache();
    clearPortalCache();
    navigate('/login', { replace: true });
  };

  return (
    <DashboardShell
      title={t('ui.profile.title')}
      description={t('ui.profile.description')}
      trailing={
        <>
          <Button onClick={() => navigate('/portal')}>{t('ui.profile.backPortal')}</Button>
          <Button type="primary" danger ghost onClick={onLogout}>
            {t('ui.portal.logout')}
          </Button>
        </>
      }
    >
      {contextHolder}
      <section className="lf-panel mb-8">
        <h2 className="lf-panel-title">{t('ui.profile.basicTitle')}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[var(--lf-border)] bg-[var(--lf-surface)] px-4 py-3">
            <div className="text-xs text-[var(--lf-muted)]">{t('ui.common.username')}</div>
            <div className="mt-1 font-medium text-[var(--lf-text)]">{data?.username ?? '-'}</div>
          </div>
          <div className="rounded-lg border border-[var(--lf-border)] bg-[var(--lf-surface)] px-4 py-3">
            <div className="text-xs text-[var(--lf-muted)]">{t('ui.common.email')}</div>
            <div className="mt-1 font-medium text-[var(--lf-text)]">{data?.email ?? '-'}</div>
          </div>
        </div>
      </section>

      <section className="lf-panel">
        <h2 className="lf-panel-title">{t('ui.profile.loginHistoryTitle')}</h2>
        <p className="lf-panel-desc">{t('ui.profile.loginHistoryDesc')}</p>
        <div className="mt-3 space-y-3">
          {recentLogins.map((item, idx) => (
            <div key={`${item.loginAt}-${idx}`} className="rounded-lg border border-[var(--lf-border)] bg-[var(--lf-surface)] px-4 py-3">
              <div className="text-sm font-medium text-[var(--lf-text)]">{formatLoginTime(item.loginAt)}</div>
              <div className="mt-1 text-xs text-[var(--lf-muted)]">
                IP: {item.ip || '-'} <span className="mx-1 text-[var(--lf-muted)]">·</span>
                UA: {item.userAgent || '-'}
              </div>
            </div>
          ))}
          {recentLogins.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[var(--lf-border)] bg-[var(--lf-surface)] py-8 text-center text-sm text-[var(--lf-muted)]">
              {t('ui.profile.emptyHistory')}
            </p>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}

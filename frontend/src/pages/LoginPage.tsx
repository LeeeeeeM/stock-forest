import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { useI18n } from '@/i18n/useI18n';
import { login } from '@/lib/api';
import { setAuthTokens } from '@/lib/auth';
import { resolveApiError } from '@/lib/error-message';

export function LoginPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await login({ username, password });
      setAuthTokens(data.accessToken, data.refreshToken);
      navigate('/portal', { replace: true });
    } catch (err: unknown) {
      messageApi.error(resolveApiError(err, 'error.loginFailed'));
    }
  };

  return (
    <AuthShell
      title={t('ui.login.title')}
      subtitle={t('ui.login.subtitle')}
      footer={
        <>
          <p className="text-slate-400">
            {t('ui.login.noAccount')}<Link className="lf-link" to="/register">{t('ui.login.toRegister')}</Link>
          </p>
          <p className="text-slate-400">
            {t('ui.login.forgotPassword')}<Link className="lf-link" to="/forgot-password">{t('ui.login.emailReset')}</Link>
          </p>
        </>
      }
    >
      {contextHolder}
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="lf-field-label" htmlFor="login-username">
            {t('ui.login.username')}
          </label>
          <input
            id="login-username"
            name="username"
            className="lf-input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder={t('ui.placeholder.username')}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="login-password">
            {t('ui.login.password')}
          </label>
          <input
            id="login-password"
            name="password"
            className="lf-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t('ui.login.password')}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            {t('ui.login.submit')}
          </Button>
          <Button type="default" onClick={() => navigate('/register')}>
            {t('ui.login.toRegister')}
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaVerifyModal } from '@/components/CaptchaVerifyModal';
import { AuthShell } from '@/components/layout/AuthShell';
import { useI18n } from '@/i18n/useI18n';
import { SendCodeButton } from '@/components/SendCodeButton';
import { register, sendRegisterVerificationCode } from '@/lib/api';
import { resolveApiError } from '@/lib/error-message';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [captchaModalOpen, setCaptchaModalOpen] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const onOpenSendCodeVerify = () => {
    const e = email.trim();
    if (!e) {
      messageApi.warning(t('error.emailRequired'));
      return;
    }
    if (!EMAIL_RE.test(e)) {
      messageApi.warning(t('error.invalidEmail'));
      return;
    }
    setCaptchaModalOpen(true);
  };

  const onVerifyAndSendCode = async (captcha: { captchaId: string; captchaCode: string }) => {
    const e = email.trim();
    await sendRegisterVerificationCode(e, captcha);
    messageApi.success(t('success.codeSent'));
    setCooldown(60);
    setCaptchaModalOpen(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const em = email.trim();
    const code = verificationCode.trim();
    if (!u) {
      messageApi.warning(t('error.usernameRequired'));
      return;
    }
    if (!EMAIL_RE.test(em)) {
      messageApi.warning(t('error.invalidEmail'));
      return;
    }
    if (password.length < 6) {
      messageApi.warning(t('error.passwordMin'));
      return;
    }
    if (password !== confirmPassword) {
      messageApi.warning(t('error.passwordMismatch'));
      return;
    }
    if (code.length < 4) {
      messageApi.warning(t('error.verificationCodeInvalid'));
      return;
    }
    try {
      const data = await register({
        username: u,
        email: em,
        password,
        verificationCode: code,
      });
      messageApi.success(`${t('success.register')}: ${data.username} (${data.email})`);
      setTimeout(() => navigate('/login', { replace: true }), 500);
    } catch (err: unknown) {
      messageApi.error(resolveApiError(err, 'error.registerFailed'));
    }
  };

  return (
    <AuthShell
      title={t('ui.register.title')}
      subtitle={t('ui.register.subtitle')}
      footer={
        <p className="text-slate-400">
          {t('ui.auth.haveAccount')}<Link className="lf-link" to="/login">{t('ui.auth.login')}</Link>
        </p>
      }
    >
      {contextHolder}
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="lf-field-label" htmlFor="reg-username">
            {t('ui.common.username')}
          </label>
          <input
            id="reg-username"
            name="username"
            className="lf-input"
            autoComplete="username"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            placeholder={t('ui.placeholder.username')}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-email">
            {t('ui.common.email')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="reg-email"
              name="email"
              className="lf-input sm:min-w-0 sm:flex-1"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder={t('ui.placeholder.email')}
            />
            <SendCodeButton
              htmlType="button"
              className="sm:w-auto"
              onClick={onOpenSendCodeVerify}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `${cooldown}s` : t('ui.common.sendCode')}
            </SendCodeButton>
          </div>
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-code">
            {t('ui.register.emailCode')}
          </label>
          <input
            id="reg-code"
            className="lf-input"
            placeholder={t('ui.placeholder.code6')}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(ev) => setVerificationCode(ev.target.value)}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-password">
            {t('ui.common.password')}
          </label>
          <input
            id="reg-password"
            name="password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder={t('ui.placeholder.password6')}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-confirm-password">
            {t('ui.register.confirmPassword')}
          </label>
          <input
            id="reg-confirm-password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            placeholder={t('ui.placeholder.confirmPassword')}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            {t('ui.register.submit')}
          </Button>
          <Button type="default" onClick={() => navigate('/login')}>
            {t('ui.auth.login')}
          </Button>
        </div>
      </form>
      <CaptchaVerifyModal
        open={captchaModalOpen}
        onCancel={() => setCaptchaModalOpen(false)}
        onVerify={onVerifyAndSendCode}
      />
    </AuthShell>
  );
}

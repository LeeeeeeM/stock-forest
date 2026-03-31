import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaVerifyModal } from '@/components/CaptchaVerifyModal';
import { AuthShell } from '@/components/layout/AuthShell';
import { useI18n } from '@/i18n/useI18n';
import { SendCodeButton } from '@/components/SendCodeButton';
import { forgotPassword, sendForgotPasswordVerificationCode } from '@/lib/api';
import { resolveApiError } from '@/lib/error-message';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
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
    await sendForgotPasswordVerificationCode(e, captcha);
    messageApi.success(t('success.codeSent'));
    setCooldown(60);
    setCaptchaModalOpen(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    const code = verificationCode.trim();
    if (!EMAIL_RE.test(em)) {
      messageApi.warning(t('error.invalidEmail'));
      return;
    }
    if (newPassword.length < 6) {
      messageApi.warning(t('error.newPasswordMin'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      messageApi.warning(t('error.newPasswordMismatch'));
      return;
    }
    if (code.length < 4) {
      messageApi.warning(t('error.verificationCodeInvalid'));
      return;
    }
    try {
      await forgotPassword({
        email: em,
        newPassword,
        verificationCode: code,
      });
      messageApi.success(t('success.passwordReset'));
      setTimeout(() => navigate('/login', { replace: true }), 600);
    } catch (err: unknown) {
      messageApi.error(resolveApiError(err, 'error.forgotPasswordFailed'));
    }
  };

  return (
    <AuthShell
      title={t('ui.forgot.title')}
      subtitle={t('ui.forgot.subtitle')}
      footer={
        <p className="text-slate-400">
          {t('ui.auth.rememberPassword')}<Link className="lf-link" to="/login">{t('ui.auth.backLogin')}</Link>
        </p>
      }
    >
      {contextHolder}
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="lf-field-label" htmlFor="forgot-email">
            {t('ui.common.email')}
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
            <input
              id="forgot-email"
              name="email"
              className="lf-input sm:min-w-0 sm:flex-1"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder={t('ui.placeholder.registerEmail')}
            />
            <SendCodeButton htmlType="button" onClick={onOpenSendCodeVerify} disabled={cooldown > 0}>
              {cooldown > 0 ? `${cooldown}s` : t('ui.common.sendCode')}
            </SendCodeButton>
          </div>
        </div>
        <div>
          <label className="lf-field-label" htmlFor="forgot-code">
            {t('ui.register.emailCode')}
          </label>
          <input
            id="forgot-code"
            className="lf-input"
            placeholder={t('ui.placeholder.code6')}
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(ev) => setVerificationCode(ev.target.value)}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="forgot-new-password">
            {t('ui.forgot.newPassword')}
          </label>
          <input
            id="forgot-new-password"
            name="new-password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(ev) => setNewPassword(ev.target.value)}
            placeholder={t('ui.placeholder.password6')}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="forgot-confirm-new-password">
            {t('ui.forgot.confirmNewPassword')}
          </label>
          <input
            id="forgot-confirm-new-password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(ev) => setConfirmNewPassword(ev.target.value)}
            placeholder={t('ui.placeholder.confirmNewPassword')}
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            {t('ui.forgot.submit')}
          </Button>
          <Button type="default" onClick={() => navigate('/login')}>
            {t('ui.forgot.backLogin')}
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

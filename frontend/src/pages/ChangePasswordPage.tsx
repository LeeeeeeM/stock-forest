import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaVerifyModal } from '@/components/CaptchaVerifyModal';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useI18n } from '@/i18n/useI18n';
import { SendCodeButton } from '@/components/SendCodeButton';
import { useSmartBack } from '@/hooks/useSmartBack';
import { changePassword, me, sendChangePasswordVerificationCode } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';
import { resolveApiError } from '@/lib/error-message';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ChangePasswordPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { t } = useI18n();
  const navigate = useNavigate();
  const backToProfile = useSmartBack('/profile');
  const token = getAccessToken();
  const [pwdEmail, setPwdEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [pwdVerificationCode, setPwdVerificationCode] = useState('');
  const [captchaModalOpen, setCaptchaModalOpen] = useState(false);
  const [pwdCooldown, setPwdCooldown] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    me(token)
      .then((p) => setPwdEmail(p.email))
      .catch(() => navigate('/login', { replace: true }));
  }, [navigate, token]);

  useEffect(() => {
    if (pwdCooldown <= 0) return;
    const t = window.setInterval(() => setPwdCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [pwdCooldown]);

  const onOpenSendCodeVerify = () => {
    if (!token) return;
    const e = pwdEmail.trim();
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
    if (!token) return;
    const e = pwdEmail.trim();
    await sendChangePasswordVerificationCode(token, e, captcha);
    messageApi.success(t('success.codeSent'));
    setPwdCooldown(60);
    setCaptchaModalOpen(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const em = pwdEmail.trim();
    const code = pwdVerificationCode.trim();
    if (!EMAIL_RE.test(em)) {
      messageApi.warning(t('error.invalidEmail'));
      return;
    }
    if (!oldPassword) {
      messageApi.warning(t('error.oldPasswordRequired'));
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
      await changePassword(token, {
        email: em,
        oldPassword,
        newPassword,
        verificationCode: code,
      });
      messageApi.success(t('success.passwordChanged'));
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPwdVerificationCode('');
    } catch (err: any) {
      messageApi.error(resolveApiError(err, 'error.changePasswordFailed'));
    }
  };

  return (
    <DashboardShell
      title={t('ui.change.title')}
      description={t('ui.change.description')}
      trailing={
        <Link
          className="lf-link text-sm font-medium"
          to="/profile"
          onClick={(e) => {
            e.preventDefault();
            backToProfile();
          }}
        >
          {t('ui.change.backProfile')}
        </Link>
      }
    >
      {contextHolder}
      <section className="lf-panel max-w-xl">
        <h2 className="lf-panel-title">{t('ui.change.securityTitle')}</h2>
        <p className="lf-panel-desc">{t('ui.change.securityDesc')}</p>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="lf-field-label" htmlFor="cp-email">
              {t('ui.common.email')}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="cp-email"
                className="lf-input sm:min-w-0 sm:flex-1"
                type="email"
                autoComplete="email"
                value={pwdEmail}
                onChange={(ev) => setPwdEmail(ev.target.value)}
                placeholder={t('ui.placeholder.accountEmail')}
              />
              <SendCodeButton htmlType="button" onClick={onOpenSendCodeVerify} disabled={pwdCooldown > 0}>
                {pwdCooldown > 0 ? `${pwdCooldown}s` : t('ui.common.sendCode')}
              </SendCodeButton>
            </div>
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-code">
              {t('ui.register.emailCode')}
            </label>
            <input
              id="cp-code"
              className="lf-input max-w-md"
              value={pwdVerificationCode}
              onChange={(ev) => setPwdVerificationCode(ev.target.value)}
              placeholder={t('ui.placeholder.code6')}
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-old">
              {t('ui.change.currentPassword')}
            </label>
            <input
              id="cp-old"
              className="lf-input max-w-md"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(ev) => setOldPassword(ev.target.value)}
              placeholder={t('ui.placeholder.currentPassword')}
            />
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-new">
              {t('ui.change.newPassword')}
            </label>
            <input
              id="cp-new"
              className="lf-input max-w-md"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              placeholder={t('ui.placeholder.password6')}
            />
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-confirm-new">
              {t('ui.change.confirmNewPassword')}
            </label>
            <input
              id="cp-confirm-new"
              className="lf-input max-w-md"
              type="password"
              autoComplete="new-password"
              value={confirmNewPassword}
              onChange={(ev) => setConfirmNewPassword(ev.target.value)}
              placeholder={t('ui.placeholder.confirmNewPassword')}
            />
          </div>
          <div className="pt-1">
            <Button type="primary" htmlType="submit" className="min-w-[10rem]">
              {t('ui.change.submit')}
            </Button>
          </div>
        </form>
      </section>
      <CaptchaVerifyModal
        open={captchaModalOpen}
        onCancel={() => setCaptchaModalOpen(false)}
        onVerify={onVerifyAndSendCode}
      />
    </DashboardShell>
  );
}

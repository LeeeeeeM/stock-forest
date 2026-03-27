import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaVerifyModal } from '@/components/CaptchaVerifyModal';
import { AuthShell } from '@/components/layout/AuthShell';
import { SendCodeButton } from '@/components/SendCodeButton';
import { forgotPassword, sendForgotPasswordVerificationCode } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
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
      messageApi.warning('请先填写邮箱');
      return;
    }
    if (!EMAIL_RE.test(e)) {
      messageApi.warning('邮箱格式不正确');
      return;
    }
    setCaptchaModalOpen(true);
  };

  const onVerifyAndSendCode = async (captcha: { captchaId: string; captchaCode: string }) => {
    const e = email.trim();
    await sendForgotPasswordVerificationCode(e, captcha);
    messageApi.success('验证码已发送到邮箱');
    setCooldown(60);
    setCaptchaModalOpen(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const em = email.trim();
    const code = verificationCode.trim();
    if (!EMAIL_RE.test(em)) {
      messageApi.warning('邮箱格式不正确');
      return;
    }
    if (newPassword.length < 6) {
      messageApi.warning('新密码至少 6 位');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      messageApi.warning('两次输入的新密码不一致');
      return;
    }
    if (code.length < 4) {
      messageApi.warning('请输入正确的邮箱验证码');
      return;
    }
    try {
      await forgotPassword({
        email: em,
        newPassword,
        verificationCode: code,
      });
      messageApi.success('密码重置成功，请使用新密码登录');
      setTimeout(() => navigate('/login', { replace: true }), 600);
    } catch (err: any) {
      messageApi.error(`重置密码失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  return (
    <AuthShell
      title="忘记密码"
      subtitle="通过注册邮箱验证码设置新密码"
      footer={
        <p className="text-slate-400">
          记起密码了？<Link className="lf-link" to="/login">去登录</Link>
        </p>
      }
    >
      {contextHolder}
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="lf-field-label" htmlFor="forgot-email">
            邮箱
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
              placeholder="注册邮箱"
            />
            <SendCodeButton htmlType="button" onClick={onOpenSendCodeVerify} disabled={cooldown > 0}>
              {cooldown > 0 ? `${cooldown}s` : '发送验证码'}
            </SendCodeButton>
          </div>
        </div>
        <div>
          <label className="lf-field-label" htmlFor="forgot-code">
            邮箱验证码
          </label>
          <input
            id="forgot-code"
            className="lf-input"
            placeholder="6 位数字"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(ev) => setVerificationCode(ev.target.value)}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="forgot-new-password">
            新密码
          </label>
          <input
            id="forgot-new-password"
            name="new-password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={newPassword}
            onChange={(ev) => setNewPassword(ev.target.value)}
            placeholder="至少 6 位"
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="forgot-confirm-new-password">
            确认新密码
          </label>
          <input
            id="forgot-confirm-new-password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={confirmNewPassword}
            onChange={(ev) => setConfirmNewPassword(ev.target.value)}
            placeholder="请再次输入新密码"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            重置密码
          </Button>
          <Button type="default" onClick={() => navigate('/login')}>
            返回登录
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

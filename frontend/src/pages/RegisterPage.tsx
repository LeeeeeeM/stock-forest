import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { CaptchaVerifyModal } from '@/components/CaptchaVerifyModal';
import { AuthShell } from '@/components/layout/AuthShell';
import { SendCodeButton } from '@/components/SendCodeButton';
import { register, sendRegisterVerificationCode } from '@/lib/api';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function RegisterPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
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
    await sendRegisterVerificationCode(e, captcha);
    messageApi.success(
      '验证码已发送，请查收邮箱',
    );
    setCooldown(60);
    setCaptchaModalOpen(false);
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const u = username.trim();
    const em = email.trim();
    const code = verificationCode.trim();
    if (!u) {
      messageApi.warning('用户名不能为空');
      return;
    }
    if (!EMAIL_RE.test(em)) {
      messageApi.warning('邮箱格式不正确');
      return;
    }
    if (password.length < 6) {
      messageApi.warning('密码至少 6 位');
      return;
    }
    if (password !== confirmPassword) {
      messageApi.warning('两次输入的密码不一致');
      return;
    }
    if (code.length < 4) {
      messageApi.warning('请输入正确的邮箱验证码');
      return;
    }
    try {
      const data = await register({
        username: u,
        email: em,
        password,
        verificationCode: code,
      });
      messageApi.success(`注册成功: ${data.username} (${data.email})`);
      setTimeout(() => navigate('/login', { replace: true }), 500);
    } catch (err: any) {
      messageApi.error(`注册失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  return (
    <AuthShell
      title="创建账号"
      subtitle="使用邮箱验证码完成注册"
      footer={
        <p className="text-slate-400">
          已有账号？<Link className="lf-link" to="/login">登录</Link>
        </p>
      }
    >
      {contextHolder}
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="lf-field-label" htmlFor="reg-username">
            用户名
          </label>
          <input
            id="reg-username"
            name="username"
            className="lf-input"
            autoComplete="username"
            value={username}
            onChange={(ev) => setUsername(ev.target.value)}
            placeholder="用户名"
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-email">
            邮箱
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
              placeholder="you@example.com"
            />
            <SendCodeButton
              htmlType="button"
              className="sm:w-auto"
              onClick={onOpenSendCodeVerify}
              disabled={cooldown > 0}
            >
              {cooldown > 0 ? `${cooldown}s` : '发送验证码'}
            </SendCodeButton>
          </div>
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-code">
            邮箱验证码
          </label>
          <input
            id="reg-code"
            className="lf-input"
            placeholder="6 位数字"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={verificationCode}
            onChange={(ev) => setVerificationCode(ev.target.value)}
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-password">
            密码
          </label>
          <input
            id="reg-password"
            name="password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            placeholder="至少 6 位"
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="reg-confirm-password">
            确认密码
          </label>
          <input
            id="reg-confirm-password"
            className="lf-input"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(ev) => setConfirmPassword(ev.target.value)}
            placeholder="请再次输入密码"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            注册
          </Button>
          <Button type="default" onClick={() => navigate('/login')}>
            去登录
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

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { FlashMessage } from '@/components/FlashMessage';
import { AuthShell } from '@/components/layout/AuthShell';
import { SendCodeButton } from '@/components/SendCodeButton';
import { register, sendRegisterVerificationCode } from '@/lib/api';

export function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => (c <= 1 ? 0 : c - 1)), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  const onSendCode = async () => {
    const e = email.trim();
    if (!e) {
      setMessage('请先填写邮箱');
      return;
    }
    try {
      await sendRegisterVerificationCode(e);
      setMessage(
        '验证码已发送，请查收邮箱（请将后端 RESEND_API_KEY 中的 re_xxxxxxxxx 换成真实 Key）',
      );
      setCooldown(60);
    } catch (err: any) {
      setMessage(`发送失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await register({
        username,
        email,
        password,
        verificationCode: verificationCode.trim(),
      });
      setMessage(`注册成功: ${data.username} (${data.email})`);
      setTimeout(() => navigate('/login', { replace: true }), 500);
    } catch (err: any) {
      setMessage(`注册失败: ${err?.response?.data?.message ?? err.message}`);
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
              onClick={onSendCode}
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
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            注册
          </Button>
          <Button type="default" onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>
      </form>
      {message ? <FlashMessage className="mt-6" message={message} /> : null}
    </AuthShell>
  );
}

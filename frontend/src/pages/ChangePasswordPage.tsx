import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { FlashMessage } from '@/components/FlashMessage';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { SendCodeButton } from '@/components/SendCodeButton';
import { changePassword, me, sendChangePasswordVerificationCode } from '@/lib/api';
import { getAccessToken } from '@/lib/auth';

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const token = getAccessToken();
  const [message, setMessage] = useState('');
  const [pwdEmail, setPwdEmail] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwdVerificationCode, setPwdVerificationCode] = useState('');
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

  const onSendPwdCode = async () => {
    if (!token) return;
    const e = pwdEmail.trim();
    if (!e) {
      setMessage('请先填写邮箱');
      return;
    }
    try {
      await sendChangePasswordVerificationCode(token, e);
      setMessage('验证码已发送到邮箱');
      setPwdCooldown(60);
    } catch (err: any) {
      setMessage(`发送验证码失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await changePassword(token, {
        email: pwdEmail.trim(),
        oldPassword,
        newPassword,
        verificationCode: pwdVerificationCode.trim(),
      });
      setMessage('密码已修改，请使用新密码重新登录');
      setOldPassword('');
      setNewPassword('');
      setPwdVerificationCode('');
    } catch (err: any) {
      setMessage(`修改密码失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  return (
    <DashboardShell
      title="修改密码"
      description="验证码将发送至当前账号绑定邮箱，修改后请重新登录。"
      trailing={
        <Link className="lf-link text-sm font-medium" to="/portal">
          返回门户
        </Link>
      }
    >
      {message ? <FlashMessage className="mb-6" message={message} /> : null}
      <section className="lf-panel max-w-xl">
        <h2 className="lf-panel-title">安全验证</h2>
        <p className="lf-panel-desc">请确认邮箱与账号一致，并完成验证码校验。</p>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <label className="lf-field-label" htmlFor="cp-email">
              邮箱
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
              <input
                id="cp-email"
                className="lf-input sm:min-w-0 sm:flex-1"
                type="email"
                autoComplete="email"
                value={pwdEmail}
                onChange={(ev) => setPwdEmail(ev.target.value)}
                placeholder="须与当前账号邮箱一致"
              />
              <SendCodeButton htmlType="button" onClick={onSendPwdCode} disabled={pwdCooldown > 0}>
                {pwdCooldown > 0 ? `${pwdCooldown}s` : '发送验证码'}
              </SendCodeButton>
            </div>
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-code">
              邮箱验证码
            </label>
            <input
              id="cp-code"
              className="lf-input max-w-md"
              value={pwdVerificationCode}
              onChange={(ev) => setPwdVerificationCode(ev.target.value)}
              placeholder="6 位数字"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-old">
              当前密码
            </label>
            <input
              id="cp-old"
              className="lf-input max-w-md"
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(ev) => setOldPassword(ev.target.value)}
              placeholder="当前登录密码"
            />
          </div>
          <div>
            <label className="lf-field-label" htmlFor="cp-new">
              新密码
            </label>
            <input
              id="cp-new"
              className="lf-input max-w-md"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(ev) => setNewPassword(ev.target.value)}
              placeholder="至少 6 位"
            />
          </div>
          <div className="pt-1">
            <Button type="primary" htmlType="submit" className="min-w-[10rem]">
              确认修改密码
            </Button>
          </div>
        </form>
      </section>
    </DashboardShell>
  );
}

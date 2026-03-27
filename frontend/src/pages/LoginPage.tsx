import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { AuthShell } from '@/components/layout/AuthShell';
import { login } from '@/lib/api';
import { setAccessToken } from '@/lib/auth';

export function LoginPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const data = await login({ username, password });
      setAccessToken(data.accessToken);
      navigate('/portal', { replace: true });
    } catch (err: any) {
      messageApi.error(`登录失败: ${err?.response?.data?.message ?? err.message}`);
    }
  };

  return (
    <AuthShell
      title="欢迎回来"
      subtitle="登录后继续查看自选与行情"
      footer={
        <>
          <p className="text-slate-400">
            没有账号？<Link className="lf-link" to="/register">注册</Link>
          </p>
          <p className="text-slate-400">
            忘记密码？<Link className="lf-link" to="/forgot-password">邮箱重置</Link>
          </p>
        </>
      }
    >
      {contextHolder}
      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label className="lf-field-label" htmlFor="login-username">
            用户名
          </label>
          <input
            id="login-username"
            name="username"
            className="lf-input"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="用户名"
          />
        </div>
        <div>
          <label className="lf-field-label" htmlFor="login-password">
            密码
          </label>
          <input
            id="login-password"
            name="password"
            className="lf-input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码"
          />
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="primary" htmlType="submit" className="min-w-[7rem]">
            登录
          </Button>
          <Button type="default" onClick={() => navigate('/register')}>
            去注册
          </Button>
        </div>
      </form>
    </AuthShell>
  );
}

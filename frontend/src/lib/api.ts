import axios from 'axios';
import type { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { clearAuthTokens, getAccessToken, getRefreshToken, setAccessToken } from '@/lib/auth';
import { getLocale } from '@/i18n';

export const api = axios.create({
  baseURL: '/api',
});

type RetryRequestConfig = AxiosRequestConfig & {
  _retry?: boolean;
  skipAuthRefresh?: boolean;
};

let refreshAccessTokenPromise: Promise<string> | null = null;

function shouldSkipAutoRefresh(url?: string) {
  if (!url) return false;
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/captcha') ||
    url.includes('/auth/email-verification/register') ||
    url.includes('/auth/email-verification/forgot-password') ||
    url.includes('/auth/forgot-password')
  );
}

async function requestNewAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('missing refresh token');
  }
  const refreshConfig: RetryRequestConfig = { skipAuthRefresh: true };
  const res = await api.post('/auth/refresh', { refreshToken }, refreshConfig);
  const accessToken = (res.data?.accessToken as string | undefined) ?? '';
  if (!accessToken) {
    throw new Error('invalid refresh response');
  }
  setAccessToken(accessToken);
  return accessToken;
}

async function getNewAccessToken() {
  if (!refreshAccessTokenPromise) {
    refreshAccessTokenPromise = requestNewAccessToken().finally(() => {
      refreshAccessTokenPromise = null;
    });
  }
  return refreshAccessTokenPromise;
}

api.interceptors.request.use((config) => {
  config.headers = config.headers ?? {};

  const headers = config.headers as InternalAxiosRequestConfig['headers'];
  if (typeof headers.set === 'function') {
    headers.set('Accept-Language', getLocale());
  } else {
    (headers as Record<string, string>)['Accept-Language'] = getLocale();
  }
  const token = getAccessToken();
  const existingAuth = typeof headers.get === 'function'
    ? headers.get('Authorization')
    : (headers as Record<string, string>).Authorization;
  if (token && !existingAuth) {
    if (typeof headers.set === 'function') {
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const originalRequest = error.config as (InternalAxiosRequestConfig & RetryRequestConfig) | undefined;
    if (!originalRequest || status !== 401) {
      return Promise.reject(error);
    }
    if (originalRequest._retry || originalRequest.skipAuthRefresh || shouldSkipAutoRefresh(originalRequest.url)) {
      return Promise.reject(error);
    }

    if (!getRefreshToken()) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await getNewAccessToken();
      originalRequest.headers = originalRequest.headers ?? {};
      const headers = originalRequest.headers as InternalAxiosRequestConfig['headers'];
      if (typeof headers.set === 'function') {
        headers.set('Authorization', `Bearer ${newAccessToken}`);
      } else {
        (headers as Record<string, string>).Authorization = `Bearer ${newAccessToken}`;
      }
      return api.request(originalRequest);
    } catch (refreshErr) {
      clearAuthTokens();
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.replace('/login');
      }
      return Promise.reject(refreshErr);
    }
  },
);

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  verificationCode: string;
};

export type LoginPayload = {
  username: string;
  password: string;
};

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload);
  return res.data;
}

export type CaptchaPayload = {
  captchaId: string;
  captchaCode: string;
};

export type CaptchaData = {
  captchaId: string;
  imageBase64: string;
  imageDataUrl: string;
};

export async function getCaptcha() {
  const res = await api.get('/auth/captcha');
  return res.data as CaptchaData;
}

export async function sendRegisterVerificationCode(email: string, captcha: CaptchaPayload) {
  const res = await api.post('/auth/email-verification/register', { email, ...captcha });
  return res.data as { message: string };
}

export async function sendChangePasswordVerificationCode(token: string, email: string, captcha: CaptchaPayload) {
  const res = await api.post(
    '/auth/email-verification/change-password',
    { email, ...captcha },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data as { message: string };
}

export async function sendForgotPasswordVerificationCode(email: string, captcha: CaptchaPayload) {
  const res = await api.post('/auth/email-verification/forgot-password', { email, ...captcha });
  return res.data as { message: string };
}

export type ChangePasswordPayload = {
  email: string;
  oldPassword: string;
  newPassword: string;
  verificationCode: string;
};

export async function changePassword(token: string, payload: ChangePasswordPayload) {
  const res = await api.post('/auth/change-password', payload, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { message: string };
}

export type ForgotPasswordPayload = {
  email: string;
  newPassword: string;
  verificationCode: string;
};

export async function forgotPassword(payload: ForgotPasswordPayload) {
  const res = await api.post('/auth/forgot-password', payload);
  return res.data as { message: string };
}

export async function login(payload: LoginPayload) {
  const res = await api.post('/auth/login', payload);
  return res.data as {
    user: { id: number; username: string; email: string };
    accessToken: string;
    refreshToken: string;
  };
}

export async function me(token: string) {
  const res = await api.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as { id: number; username: string; email: string };
}

export type ProfileLoginItem = {
  loginAt: string;
  ip: string;
  userAgent: string;
};

export type ProfileData = {
  id: number;
  username: string;
  email: string;
  recentLogins: ProfileLoginItem[];
};

export async function profile(token: string) {
  const res = await api.get('/auth/profile', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.data as ProfileData;
}

export type SearchItem = {
  code: string;
  name: string;
  market: string;
};

export type Quote = {
  code: string;
  market: string;
  name: string;
  price: string;
  open?: string;
  yestClose?: string;
  high?: string;
  low?: string;
  volume?: string;
  amount?: string;
  buy1?: string;
  sell1?: string;
  percent?: string;
  change?: string;
  time?: string;
};

export type WatchlistItem = {
  id: number;
  userId: number;
  code: string;
  name: string;
  market: string;
  createdAt: string;
};

function authHeader(token: string) {
  return { Authorization: `Bearer ${token}` };
}

export async function searchStocks(q: string) {
  const res = await api.get<SearchItem[]>('/stocks/search', { params: { q } });
  return res.data;
}

export async function listWatchlist(token: string) {
  const res = await api.get<WatchlistItem[]>('/watchlist', {
    headers: authHeader(token),
  });
  return res.data;
}

export async function addWatchlist(token: string, payload: Pick<WatchlistItem, 'code' | 'name' | 'market'>) {
  const res = await api.post<WatchlistItem>('/watchlist', payload, {
    headers: authHeader(token),
  });
  return res.data;
}

export async function removeWatchlist(token: string, id: number) {
  await api.delete(`/watchlist/${id}`, {
    headers: authHeader(token),
  });
}

export async function getWatchlistQuotes(token: string) {
  const res = await api.get<Quote[]>('/watchlist/quotes', {
    headers: authHeader(token),
  });
  return res.data;
}

import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
});

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

export async function sendRegisterVerificationCode(email: string) {
  const res = await api.post('/auth/email-verification/register', { email });
  return res.data as { message: string };
}

export async function sendChangePasswordVerificationCode(token: string, email: string) {
  const res = await api.post(
    '/auth/email-verification/change-password',
    { email },
    { headers: { Authorization: `Bearer ${token}` } },
  );
  return res.data as { message: string };
}

export async function sendForgotPasswordVerificationCode(email: string) {
  const res = await api.post('/auth/email-verification/forgot-password', { email });
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


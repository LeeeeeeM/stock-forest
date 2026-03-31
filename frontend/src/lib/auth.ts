import { useAuthStore } from '@/store/auth-store';

export function getAccessToken() {
  return useAuthStore.getState().accessToken ?? '';
}

export function getRefreshToken() {
  return useAuthStore.getState().refreshToken ?? '';
}

export function setAuthTokens(accessToken: string, refreshToken: string) {
  useAuthStore.getState().setTokens(accessToken, refreshToken);
}

export function setAccessToken(token: string) {
  useAuthStore.getState().setAccessToken(token);
}

export function setRefreshToken(token: string) {
  useAuthStore.getState().setRefreshToken(token);
}

export function clearAccessToken() {
  useAuthStore.getState().clearTokens();
}

export function clearAuthTokens() {
  useAuthStore.getState().clearTokens();
}

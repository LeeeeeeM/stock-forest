import { useAuthStore } from '@/store/auth-store';

export function getAccessToken() {
  return useAuthStore.getState().accessToken ?? '';
}

export function setAccessToken(token: string) {
  useAuthStore.getState().setAccessToken(token);
}

export function clearAccessToken() {
  useAuthStore.getState().clearAccessToken();
}

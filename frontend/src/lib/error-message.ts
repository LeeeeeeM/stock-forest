import { t } from '@/i18n';

type ApiErrorBody = {
  code?: string;
  message?: string;
};

type ErrorWithResponse = Error & {
  response?: {
    data?: ApiErrorBody;
  };
};

export function resolveApiError(err: unknown, fallbackKey: string): string {
  const e = err as ErrorWithResponse;
  const payload = e?.response?.data;
  if (payload?.message) {
    return payload.message;
  }
  return `${t(fallbackKey)}: ${e?.message ?? 'Unknown error'}`;
}


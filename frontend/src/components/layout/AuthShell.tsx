import type { ReactNode } from 'react';
import { GlobalTopNav } from '@/components/layout/GlobalTopNav';

type Props = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthShell({ title, subtitle, children, footer }: Props) {
  return (
    <div className="lf-page lf-backdrop min-h-dvh">
      <GlobalTopNav />
      <div className="flex min-h-[calc(100dvh-56px)] flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="lf-hero-title">{title}</h1>
          {subtitle ? <p className="lf-hero-subtitle mt-2">{subtitle}</p> : null}
        </div>
        <div className="lf-glass-card p-6 sm:p-8">{children}</div>
        {footer ? <div className="mt-7 space-y-2 text-center text-sm">{footer}</div> : null}
      </div>
      </div>
    </div>
  );
}

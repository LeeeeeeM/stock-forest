import type { ReactNode } from 'react';
import { GlobalTopNav } from '@/components/layout/GlobalTopNav';

type Props = {
  title: string;
  description?: string;
  trailing?: ReactNode;
  children: ReactNode;
};

export function DashboardShell({ title, description, trailing, children }: Props) {
  return (
    <div className="lf-page lf-backdrop min-h-dvh">
      <GlobalTopNav />
      <header className="sticky top-[56px] z-20 border-b border-[var(--lf-border)] bg-[var(--lf-header-bg)] backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-start justify-between gap-4 px-4 py-4 sm:items-center sm:px-6">
          <div className="min-w-0">
            <h1 className="text-lg font-semibold tracking-tight text-[var(--lf-text)] sm:text-xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-slate-400">{description}</p>
            ) : null}
          </div>
          <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:justify-end sm:gap-3">
            {trailing}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { AutoComplete, Button, message as antdMessage } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { useI18n } from '@/i18n/useI18n';
import {
  addWatchlist,
  getWatchlistQuotes,
  listWatchlist,
  me,
  removeWatchlist,
  searchStocks,
  type Quote,
  type SearchItem,
  type WatchlistItem,
} from '@/lib/api';
import { clearAccessToken, getAccessToken } from '@/lib/auth';
import { resolveApiError } from '@/lib/error-message';

function toNumberSafe(value?: string) {
  if (!value) return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getTrendClass(change?: string) {
  const n = toNumberSafe(change);
  if (n > 0) return 'text-rose-400';
  if (n < 0) return 'text-emerald-400';
  return 'text-slate-300';
}

function formatPercent(percent?: string) {
  if (!percent) return '-';
  const n = Number(percent);
  if (!Number.isFinite(n)) return '-';
  if (n > 0) return `+${n.toFixed(2)}%`;
  if (n < 0) return `${n.toFixed(2)}%`;
  return '0.00%';
}

export function PortalPage() {
  const [messageApi, contextHolder] = antdMessage.useMessage();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ id: number; username: string; email: string } | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<SearchItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const token = getAccessToken();

  useEffect(() => {
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
    me(token).then(setProfile).catch(() => navigate('/login', { replace: true }));
    listWatchlist(token).then(setWatchlist).catch(() => undefined);
  }, [navigate, token]);

  useEffect(() => {
    if (!token) return;
    if (watchlist.length === 0) {
      setQuotes([]);
      return;
    }
    const fetchQuotes = async () => {
      try {
        const data = await getWatchlistQuotes(token);
        setQuotes(data);
      } catch {
        // noop
      }
    };
    fetchQuotes();
    const id = window.setInterval(fetchQuotes, 3000);
    return () => window.clearInterval(id);
  }, [token, watchlist.length]);

  const quoteMap = useMemo(() => new Map(quotes.map((q) => [q.code.toLowerCase(), q])), [quotes]);

  const onSearchKeyword = async (value: string) => {
    setSearchKeyword(value);
    const q = value.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    try {
      setSearchLoading(true);
      const data = await searchStocks(q);
      setSearchResults(data.slice(0, 20));
    } catch (err: any) {
      messageApi.error(resolveApiError(err, 'error.searchFailed'));
    } finally {
      setSearchLoading(false);
    }
  };

  const onAddWatch = async (item: SearchItem) => {
    try {
      const created = await addWatchlist(token, {
        code: item.code,
        name: item.name,
        market: item.market,
      });
      setWatchlist((prev) => [created, ...prev]);
    } catch (err: any) {
      messageApi.error(resolveApiError(err, 'error.addWatchlistFailed'));
    }
  };

  const onRemoveWatch = async (id: number) => {
    try {
      await removeWatchlist(token, id);
      setWatchlist((prev) => prev.filter((x) => x.id !== id));
    } catch (err: any) {
      messageApi.error(resolveApiError(err, 'error.removeWatchlistFailed'));
    }
  };

  const onLogout = () => {
    clearAccessToken();
    navigate('/login', { replace: true });
  };

  const searchOptions = searchResults.map((item) => ({
    value: `${item.market}:${item.code}`,
    label: `${item.name} (${item.code} · ${item.market})`,
  }));

  const onSelectSearch = async (value: string) => {
    const [market, code] = value.split(':');
    const target = searchResults.find((item) => item.market === market && item.code === code);
    if (!target) return;
    await onAddWatch(target);
    setSearchKeyword('');
    setSearchResults([]);
  };

  const userLine = profile ? (
    <span className="max-w-[min(100%,20rem)] truncate text-sm text-slate-400 sm:max-w-[28rem]">
      <span className="font-medium text-slate-200">{profile.username}</span>
      <span className="mx-1.5 text-slate-600">·</span>
      <span className="tabular-nums">{profile.email}</span>
    </span>
  ) : (
    <span className="text-sm text-slate-500">{t('ui.portal.loading')}</span>
  );

  return (
    <DashboardShell
      title={t('ui.portal.title')}
      description={t('ui.portal.description')}
      trailing={
        <>
          {userLine}
          <Link className="lf-link text-sm font-medium" to="/change-password">
            {t('ui.portal.changePassword')}
          </Link>
          <Button type="primary" danger ghost onClick={onLogout}>
            {t('ui.portal.logout')}
          </Button>
        </>
      }
    >
      {contextHolder}

      <section className="lf-panel mb-8">
        <h2 className="lf-panel-title">{t('ui.portal.searchTitle')}</h2>
        <p className="lf-panel-desc">
          {t('ui.portal.searchDesc')}
        </p>
        <AutoComplete
          className="w-full [&_.ant-select-selector]:min-h-10 [&_.ant-select-selector]:px-3 [&_.ant-select-selector]:py-1"
          value={searchKeyword}
          options={searchOptions}
          onSearch={onSearchKeyword}
          onSelect={onSelectSearch}
          placeholder={t('ui.portal.searchPlaceholder')}
          notFoundContent={searchLoading ? t('ui.portal.searching') : t('ui.portal.noResults')}
          classNames={{ popup: { root: 'lf-select-dropdown' } }}
        />
      </section>

      <section className="lf-panel">
        <h2 className="lf-panel-title">{t('ui.portal.watchlistTitle')}</h2>
        <p className="lf-panel-desc">{t('ui.portal.watchlistDesc')}</p>
        <div className="space-y-3">
          {watchlist.map((item) => {
            const q = quoteMap.get(item.code.toLowerCase());
            const trendClass = getTrendClass(q?.change);
            return (
              <div key={item.id} className="lf-row-card flex-wrap sm:flex-nowrap">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-100">{item.name}</div>
                  <div className="text-xs text-slate-500">
                    {item.code} · {item.market}
                    <span className="mx-1.5 text-slate-600">·</span>
                    {q?.time ?? '—'}
                  </div>
                </div>
                <div className="grid w-full min-w-0 flex-1 grid-cols-2 gap-x-6 text-right sm:w-auto">
                  <div>
                    <div className={`lf-tabular text-base font-semibold ${trendClass}`}>
                      {q?.price ?? '—'}
                    </div>
                    <div className={`lf-tabular text-xs ${trendClass}`}>
                      {q?.change ?? '—'} · {formatPercent(q?.percent)}
                    </div>
                  </div>
                  <div className="lf-tabular text-xs text-slate-500">
                    <div>{t('ui.portal.high')} {q?.high ?? '—'}</div>
                    <div>{t('ui.portal.low')} {q?.low ?? '—'}</div>
                  </div>
                </div>
                <Button danger type="default" onClick={() => onRemoveWatch(item.id)}>
                  {t('ui.portal.delete')}
                </Button>
              </div>
            );
          })}
          {watchlist.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-600/60 bg-slate-900/30 py-10 text-center text-sm text-slate-500">
              {t('ui.portal.emptyWatchlist')}
            </p>
          ) : null}
        </div>
      </section>
    </DashboardShell>
  );
}

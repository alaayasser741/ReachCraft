import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  ScrollText,
  Search,
  Mail,
  MessageSquare,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Activity,
  Layers,
  Trash2,
  Edit3,
  PlusCircle,
  Play,
  Pause,
  Ban,
  FileText,
  Settings as SettingsIcon,
  Shield,
  User,
  Building2,
  X,
  Send,
  UploadCloud,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { MessageLog, ActivityLog } from '../types';

export const Logs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { error: toastError } = useToast();
  const { t, dir } = useTranslation();

  // Tab & Filters from URL
  const activeTab = (searchParams.get('tab') as 'activity' | 'messages') || 'activity';
  const urlCategory = searchParams.get('category') || 'all';
  const urlChannel = searchParams.get('channel') || 'all';
  const urlStatus = searchParams.get('status') || 'all';
  const urlSearch = searchParams.get('search') || '';
  const pageParam = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSizeParam = Math.max(10, parseInt(searchParams.get('pageSize') || '25', 10));

  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Search input state with debouncing
  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  // Selected modals
  const [selectedActivity, setSelectedActivity] = useState<ActivityLog | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageLog | null>(null);

  // Sync search input when URL changes
  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  // Debounce search input (350ms) and sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput !== urlSearch) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (searchInput.trim()) {
              next.set('search', searchInput.trim());
            } else {
              next.delete('search');
            }
            next.set('page', '1');
            return next;
          },
          { replace: true }
        );
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadStats = async () => {
    try {
      const statsRes = await api.getLogStats();
      if (statsRes.success) {
        setStats(statsRes.stats);
      }
    } catch (err) {
      console.error('Failed to load log stats:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'activity') {
        const res = await api.getActivityLogs({
          category: urlCategory !== 'all' ? urlCategory : undefined,
          status: urlStatus !== 'all' ? urlStatus : undefined,
          search: debouncedSearch || undefined,
          page: pageParam,
          limit: pageSizeParam,
        });
        if (res.success) {
          setActivities(res.activities);
          setTotalItems(res.total);
          setTotalPages(res.totalPages);
        }
      } else {
        const res = await api.getLogs({
          channel: urlChannel !== 'all' ? urlChannel : undefined,
          status: urlStatus !== 'all' ? urlStatus : undefined,
          search: debouncedSearch || undefined,
          page: pageParam,
          limit: pageSizeParam,
        });
        if (res.success) {
          setMessageLogs(res.logs);
          setTotalItems(res.total ?? res.count);
          setTotalPages(res.totalPages ?? (Math.ceil((res.total ?? res.count) / pageSizeParam) || 1));
        }
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, urlCategory, urlChannel, urlStatus, debouncedSearch, pageParam, pageSizeParam]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleTabChange = (tab: 'activity' | 'messages') => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams();
        next.set('tab', tab);
        next.set('page', '1');
        next.set('pageSize', String(pageSizeParam));
        return next;
      },
      { replace: true }
    );
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (category === 'all') {
          next.delete('category');
        } else {
          next.set('category', category);
        }
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  const handleChannelChange = (channel: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (channel === 'all') {
          next.delete('channel');
        } else {
          next.set('channel', channel);
        }
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  const handleStatusChange = (status: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (status === 'all') {
          next.delete('status');
        } else {
          next.set('status', status);
        }
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('page', String(newPage));
        return next;
      },
      { replace: true }
    );
  };

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('pageSize', String(newSize));
        next.set('page', '1');
        return next;
      },
      { replace: true }
    );
  };

  // Helper icons and colors for categories
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'campaign':
        return (
          <Badge variant="brand" size="sm" icon={<Send className="w-3 h-3" />}>
            {t('logs.categoryCampaign')}
          </Badge>
        );
      case 'contact':
        return (
          <Badge variant="emerald" size="sm" icon={<User className="w-3 h-3" />}>
            {t('logs.categoryContact')}
          </Badge>
        );
      case 'company':
        return (
          <Badge variant="purple" size="sm" icon={<Building2 className="w-3 h-3" />}>
            {t('logs.categoryCompany')}
          </Badge>
        );
      case 'file':
        return (
          <Badge variant="warning" size="sm" icon={<UploadCloud className="w-3 h-3" />}>
            {t('logs.categoryFile')}
          </Badge>
        );
      case 'message':
        return (
          <Badge variant="success" size="sm" icon={<Mail className="w-3 h-3" />}>
            {t('logs.categoryMessage')}
          </Badge>
        );
      case 'template':
        return (
          <Badge variant="info" size="sm" icon={<FileText className="w-3 h-3" />}>
            {t('logs.categoryTemplate')}
          </Badge>
        );
      case 'settings':
        return (
          <Badge variant="slate" size="sm" icon={<SettingsIcon className="w-3 h-3" />}>
            {t('logs.categorySettings')}
          </Badge>
        );
      case 'auth':
        return (
          <Badge variant="danger" size="sm" icon={<Shield className="w-3 h-3" />}>
            {t('logs.categoryAuth')}
          </Badge>
        );
      default:
        return (
          <Badge variant="slate" size="sm">
            {category}
          </Badge>
        );
    }
  };

  // Helper badge for actions
  const getActionBadge = (action: string) => {
    switch (action) {
      case 'create':
      case 'upload':
      case 'confirm':
        return <Badge variant="success" size="sm">إنشاء / إضافة</Badge>;
      case 'delete':
        return <Badge variant="danger" size="sm">حذف</Badge>;
      case 'update':
        return <Badge variant="brand" size="sm">تعديل</Badge>;
      case 'start':
      case 'resume':
        return <Badge variant="success" size="sm">إطلاق / استئناف</Badge>;
      case 'pause':
      case 'cancel':
        return <Badge variant="warning" size="sm">إيقاف / إلغاء</Badge>;
      case 'send':
        return <Badge variant="emerald" size="sm">إرسال</Badge>;
      case 'login':
        return <Badge variant="info" size="sm">دخول</Badge>;
      default:
        return <Badge variant="slate" size="sm">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('logs.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('logs.subtitle')}
        </p>
      </div>

      {/* Primary Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit border border-slate-200/60 dark:border-slate-800 shadow-xs">
        <button
          onClick={() => handleTabChange('activity')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'activity'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4 text-brand-600" />
          <span>{t('logs.tabSystemActivity')}</span>
          {stats?.totalActivities !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 dark:bg-brand-950/60 text-brand-700 dark:text-brand-300 font-extrabold">
              {stats.totalActivities}
            </span>
          )}
        </button>

        <button
          onClick={() => handleTabChange('messages')}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'messages'
              ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-300 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Mail className="w-4 h-4 text-emerald-600" />
          <span>{t('logs.tabMessageLogs')}</span>
          {stats?.totalLogs !== undefined && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-extrabold">
              {stats.totalLogs}
            </span>
          )}
        </button>
      </div>

      {/* Mini Stats Ribbon */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {activeTab === 'activity' ? (
            <>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">{t('logs.totalActivities')}</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats.totalActivities || 0}
                </p>
              </Card>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-brand-600 font-semibold uppercase">{t('logs.activitiesToday')}</span>
                <p className="text-xl font-extrabold text-brand-700 dark:text-brand-300 mt-1">
                  {stats.activitiesToday || 0}
                </p>
              </Card>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-purple-600 font-semibold uppercase">{t('logs.categoryCampaign')}</span>
                <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                  {stats.activityCategories?.find((c: any) => c.category === 'campaign')?.count || 0}
                </p>
              </Card>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-teal-600 font-semibold uppercase">{t('logs.categoryContact')} & {t('logs.categoryCompany')}</span>
                <p className="text-xl font-extrabold text-teal-700 dark:text-teal-300 mt-1">
                  {(stats.activityCategories?.find((c: any) => c.category === 'contact')?.count || 0) +
                    (stats.activityCategories?.find((c: any) => c.category === 'company')?.count || 0)}
                </p>
              </Card>
            </>
          ) : (
            <>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-slate-500 font-semibold uppercase">{t('logs.totalMessages')}</span>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {stats.totalLogs}
                </p>
              </Card>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-brand-600 font-semibold uppercase">{t('logs.emailsDispatched')}</span>
                <p className="text-xl font-extrabold text-brand-700 dark:text-brand-300 mt-1">
                  {stats.emailSent}
                </p>
              </Card>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-emerald-600 font-semibold uppercase">{t('logs.whatsAppDispatched')}</span>
                <p className="text-xl font-extrabold text-emerald-700 dark:text-emerald-300 mt-1">
                  {stats.waSent}
                </p>
              </Card>
              <Card className="p-3.5 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
                <span className="text-[11px] text-purple-600 font-semibold uppercase">{t('logs.dryRunSims')}</span>
                <p className="text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
                  {stats.dryRuns}
                </p>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Active Tab Filter Pills */}
          {activeTab === 'activity' ? (
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-semibold uppercase text-[11px] mr-1">
                {t('logs.colCategory')}:
              </span>
              {[
                { id: 'all', label: t('logs.categoryAll') },
                { id: 'campaign', label: t('logs.categoryCampaign') },
                { id: 'contact', label: t('logs.categoryContact') },
                { id: 'company', label: t('logs.categoryCompany') },
                { id: 'file', label: t('logs.categoryFile') },
                { id: 'message', label: t('logs.categoryMessage') },
                { id: 'template', label: t('logs.categoryTemplate') },
                { id: 'settings', label: t('logs.categorySettings') },
                { id: 'auth', label: t('logs.categoryAuth') },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleCategoryChange(c.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-xs ${
                    urlCategory === c.id
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Channel Filters */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => handleChannelChange('all')}
                  className={`px-3 py-1 rounded-lg font-semibold ${
                    urlChannel === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {t('logs.allChannels')}
                </button>
                <button
                  onClick={() => handleChannelChange('email')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                    urlChannel === 'email'
                      ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  <Mail className="w-3 h-3" />
                  <span>{t('templates.emailChannel')}</span>
                </button>
                <button
                  onClick={() => handleChannelChange('whatsapp')}
                  className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                    urlChannel === 'whatsapp'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>{t('templates.whatsAppChannel')}</span>
                </button>
              </div>

              {/* Status Filters */}
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => handleStatusChange('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    urlStatus === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {t('logs.allStatuses')}
                </button>
                <button
                  onClick={() => handleStatusChange('sent')}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    urlStatus === 'sent'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {t('campaigns.sent')}
                </button>
                <button
                  onClick={() => handleStatusChange('dry_run')}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    urlStatus === 'dry_run'
                      ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  Dry Run
                </button>
                <button
                  onClick={() => handleStatusChange('failed')}
                  className={`px-2.5 py-1 rounded-lg font-semibold ${
                    urlStatus === 'failed'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs'
                      : 'text-slate-500'
                  }`}
                >
                  {t('campaigns.failed')}
                </button>
              </div>
            </div>
          )}

          {/* Debounced Search Input */}
          <div className="relative w-full md:w-80">
            <Search
              className={`w-4 h-4 text-slate-400 absolute ${
                dir === 'rtl' ? 'right-3' : 'left-3'
              } top-1/2 -translate-y-1/2 pointer-events-none`}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                activeTab === 'activity'
                  ? 'بحث في الحركات والعمليات والتفاصيل...'
                  : t('logs.searchPlaceholder')
              }
              className={`w-full ${
                dir === 'rtl' ? 'pr-9 pl-9' : 'pl-9 pr-9'
              } py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className={`absolute ${
                  dir === 'rtl' ? 'left-3' : 'right-3'
                } top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      {activeTab === 'activity' ? (
        /* System Activity Log Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('logs.colTimestamp')}</th>
                  <th className="py-3 px-4">{t('logs.colCategory')}</th>
                  <th className="py-3 px-4">{t('logs.colAction')}</th>
                  <th className="py-3 px-4">{t('logs.colDetails')}</th>
                  <th className="py-3 px-4">{t('logs.colStatus')}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t('logs.colInspect')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : activities.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      {t('logs.noActivities')}
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => (
                    <tr key={act.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(act.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getCategoryBadge(act.category)}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        {getActionBadge(act.action)}
                      </td>

                      <td className="py-3 px-4 max-w-md">
                        <div className="font-bold text-slate-900 dark:text-white truncate">
                          {act.title}
                        </div>
                        {act.details && (
                          <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm">
                            {typeof act.details === 'string' && act.details.startsWith('{')
                              ? act.details.slice(0, 80)
                              : act.details}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <Badge
                          variant={
                            act.status === 'success'
                              ? 'success'
                              : act.status === 'warning'
                              ? 'warning'
                              : act.status === 'failed'
                              ? 'danger'
                              : 'slate'
                          }
                          size="sm"
                        >
                          {act.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-right rtl:text-left whitespace-nowrap">
                        <button
                          onClick={() => setSelectedActivity(act)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={t('logs.colInspect')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSizeParam}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      ) : (
        /* Message Delivery Log Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('logs.colChannel')}</th>
                  <th className="py-3 px-4">{t('logs.colAddress')}</th>
                  <th className="py-3 px-4">{t('logs.colContactCompany')}</th>
                  <th className="py-3 px-4">{t('logs.colSubjectMessage')}</th>
                  <th className="py-3 px-4">{t('logs.colStatus')}</th>
                  <th className="py-3 px-4">{t('logs.colTimestamp')}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t('logs.colInspect')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      {t('common.loading')}
                    </td>
                  </tr>
                ) : messageLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                      No outreach message logs recorded.
                    </td>
                  </tr>
                ) : (
                  messageLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <Badge
                          variant={log.channel === 'email' ? 'brand' : 'success'}
                          size="sm"
                          icon={
                            log.channel === 'email' ? (
                              <Mail className="w-3 h-3" />
                            ) : (
                              <MessageSquare className="w-3 h-3" />
                            )
                          }
                        >
                          {log.channel === 'email'
                            ? t('templates.emailChannel')
                            : t('templates.whatsAppChannel')}
                        </Badge>
                      </td>

                      <td
                        className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white"
                        dir="ltr"
                      >
                        {log.recipient_address}
                      </td>

                      <td className="py-3 px-4">
                        <div className="text-slate-800 dark:text-slate-200 font-bold">
                          {log.person_name || t('contacts.anonymousContact')}
                        </div>
                        <div className="text-[11px] text-slate-400">{log.company_name || '-'}</div>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-slate-600 dark:text-slate-300">
                        {log.subject || log.rendered_body.replace(/<[^>]+>/g, ' ')}
                      </td>

                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            log.status === 'sent'
                              ? 'success'
                              : log.status === 'dry_run'
                              ? 'purple'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {log.status === 'dry_run' ? 'Dry Run' : log.status.toUpperCase()}
                        </Badge>
                      </td>

                      <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString()}
                      </td>

                      <td className="py-3 px-4 text-right rtl:text-left">
                        <button
                          onClick={() => setSelectedMessage(log)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title={t('logs.viewFullMessage')}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSizeParam}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      )}

      {/* Inspect System Activity Modal */}
      {selectedActivity && (
        <Modal
          isOpen={Boolean(selectedActivity)}
          onClose={() => setSelectedActivity(null)}
          title={t('logs.inspectActivityTitle', { id: selectedActivity.id })}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-xs space-y-2 border border-slate-200/80 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getCategoryBadge(selectedActivity.category)}
                  {getActionBadge(selectedActivity.action)}
                </div>
                <span className="text-slate-400 text-[11px]">
                  {new Date(selectedActivity.created_at).toLocaleString()}
                </span>
              </div>

              <div className="text-sm font-extrabold text-slate-900 dark:text-white pt-1">
                {selectedActivity.title}
              </div>

              {selectedActivity.ip_address && (
                <div className="text-slate-400 text-[11px] font-mono">
                  IP: {selectedActivity.ip_address}
                </div>
              )}
            </div>

            {selectedActivity.details && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  تفاصيل وبيانات الحركة (Payload):
                </label>
                <pre className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto max-h-64 leading-relaxed" dir="ltr">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedActivity.details), null, 2);
                    } catch {
                      return selectedActivity.details;
                    }
                  })()}
                </pre>
              </div>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedActivity(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Inspect Message Modal */}
      {selectedMessage && (
        <Modal
          isOpen={Boolean(selectedMessage)}
          onClose={() => setSelectedMessage(null)}
          title={t('logs.inspectTitle', { id: selectedMessage.id })}
          description={t('logs.inspectSubtitle', {
            channel:
              selectedMessage.channel === 'email'
                ? t('templates.emailChannel')
                : t('templates.whatsAppChannel'),
            address: selectedMessage.recipient_address,
          })}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1.5 border border-slate-200/80 dark:border-slate-700">
              {selectedMessage.subject && (
                <div>
                  <strong className="text-slate-500">{t('logs.subjectLabel')}</strong>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedMessage.subject}
                  </span>
                </div>
              )}
              <div>
                <strong className="text-slate-500">{t('logs.deliveryStatusLabel')}</strong>
                <span className="font-bold uppercase text-brand-600">{selectedMessage.status}</span>
              </div>
              <div>
                <strong className="text-slate-500">{t('logs.providerResponseLabel')}</strong>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {selectedMessage.provider_response || selectedMessage.error || 'N/A'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('logs.dispatchedBodyLabel')}
              </label>
              <div
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs leading-relaxed max-h-72 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html:
                    selectedMessage.channel === 'email'
                      ? selectedMessage.rendered_body
                      : selectedMessage.rendered_body.replace(/\n/g, '<br/>'),
                }}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedMessage(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

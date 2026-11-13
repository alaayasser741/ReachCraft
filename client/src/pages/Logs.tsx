import React, { useEffect, useState } from 'react';
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
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { MessageLog } from '../types';

export const Logs: React.FC = () => {
  const { error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [logs, setLogs] = useState<MessageLog[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected message for preview modal
  const [selectedLog, setSelectedLog] = useState<MessageLog | null>(null);

  useEffect(() => {
    loadLogs();
  }, [channelFilter, statusFilter]);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        api.getLogs({
          channel: channelFilter !== 'all' ? channelFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          search: searchQuery || undefined,
        }),
        api.getLogStats(),
      ]);
      setLogs(logsRes.logs);
      setStats(statsRes.stats);
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch logs');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadLogs();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('logs.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('logs.subtitle')}
        </p>
      </div>

      {/* Mini Stats Ribbon */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <span className="text-xs text-slate-400 font-semibold uppercase">{t('logs.totalMessages')}</span>
            <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {stats.totalLogs}
            </p>
          </Card>
          <Card className="p-4">
            <span className="text-xs text-brand-600 font-semibold uppercase">{t('logs.emailsDispatched')}</span>
            <p className="text-xl font-bold text-brand-700 dark:text-brand-300 mt-1">
              {stats.emailSent}
            </p>
          </Card>
          <Card className="p-4">
            <span className="text-xs text-emerald-600 font-semibold uppercase">{t('logs.whatsAppDispatched')}</span>
            <p className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">
              {stats.waSent}
            </p>
          </Card>
          <Card className="p-4">
            <span className="text-xs text-purple-600 font-semibold uppercase">{t('logs.dryRunSims')}</span>
            <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-1">
              {stats.dryRuns}
            </p>
          </Card>
        </div>
      )}

      {/* Filters & Search Card */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Channel Filters */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setChannelFilter('all')}
              className={`px-3 py-1 rounded-lg font-semibold ${
                channelFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              {t('logs.allChannels')}
            </button>
            <button
              onClick={() => setChannelFilter('email')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                channelFilter === 'email' ? 'bg-white dark:bg-slate-900 text-brand-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>{t('templates.emailChannel')}</span>
            </button>
            <button
              onClick={() => setChannelFilter('whatsapp')}
              className={`px-3 py-1 rounded-lg font-semibold flex items-center gap-1 ${
                channelFilter === 'whatsapp' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{t('templates.whatsAppChannel')}</span>
            </button>
          </div>

          {/* Status Filters */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              {t('logs.allStatuses')}
            </button>
            <button
              onClick={() => setStatusFilter('sent')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'sent' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              {t('campaigns.sent')}
            </button>
            <button
              onClick={() => setStatusFilter('dry_run')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'dry_run' ? 'bg-white dark:bg-slate-900 text-purple-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Dry Run
            </button>
            <button
              onClick={() => setStatusFilter('failed')}
              className={`px-2.5 py-1 rounded-lg font-semibold ${
                statusFilter === 'failed' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              {t('campaigns.failed')}
            </button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('logs.searchPlaceholder')}
            className="w-full pl-9 rtl:pl-3 rtl:pr-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          />
        </form>
      </Card>

      {/* Logs Table */}
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                    No activity logs recorded.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
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
                        {log.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel')}
                      </Badge>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-slate-900 dark:text-white" dir="ltr">
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

                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-3 px-4 text-right rtl:text-left">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
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
      </Card>

      {/* Inspect Message Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title={t('logs.inspectTitle', { id: selectedLog.id })}
          description={t('logs.inspectSubtitle', {
            channel: selectedLog.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel'),
            address: selectedLog.recipient_address
          })}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              {selectedLog.subject && (
                <div>
                  <strong className="text-slate-500">{t('logs.subjectLabel')}</strong>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {selectedLog.subject}
                  </span>
                </div>
              )}
              <div>
                <strong className="text-slate-500">{t('logs.deliveryStatusLabel')}</strong>
                <span className="font-bold uppercase text-brand-600">{selectedLog.status}</span>
              </div>
              <div>
                <strong className="text-slate-500">{t('logs.providerResponseLabel')}</strong>
                <span className="font-mono text-slate-600 dark:text-slate-300">
                  {selectedLog.provider_response || selectedLog.error || 'N/A'}
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
                    selectedLog.channel === 'email'
                      ? selectedLog.rendered_body
                      : selectedLog.rendered_body.replace(/\n/g, '<br/>'),
                }}
              />
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button size="sm" variant="outline" onClick={() => setSelectedLog(null)}>
                {t('common.close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

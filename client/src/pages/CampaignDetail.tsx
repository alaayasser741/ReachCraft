import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Ban,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Shield,
  Search,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Campaign, CampaignRecipient } from '../types';

export const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const campaignId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadCampaignData();
    // Auto-poll progress every 3 seconds if running
    const interval = setInterval(() => {
      if (campaign?.status === 'running') {
        loadCampaignData(false);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [campaignId, campaign?.status]);

  const loadCampaignData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const [campRes, recRes] = await Promise.all([
        api.getCampaign(campaignId),
        api.getCampaignRecipients(campaignId),
      ]);
      setCampaign(campRes.campaign);
      setRecipients(recRes.recipients);
    } catch (err: any) {
      toastError(err.message || 'Failed to load campaign');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const handleStart = async () => {
    try {
      await api.startCampaign(campaignId);
      toastSuccess('Campaign started');
      loadCampaignData(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to start');
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseCampaign(campaignId);
      toastSuccess('Campaign paused');
      loadCampaignData(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to pause');
    }
  };

  const handleResume = async () => {
    try {
      await api.resumeCampaign(campaignId);
      toastSuccess('Campaign resumed');
      loadCampaignData(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to resume');
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    try {
      await api.cancelCampaign(campaignId);
      toastSuccess('Campaign cancelled');
      loadCampaignData(false);
    } catch (err: any) {
      toastError(err.message || 'Failed to cancel');
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await api.deleteCampaign(campaignId);
      toastSuccess(res.message || t('campaigns.deleteSuccess'));
      navigate('/campaigns');
    } catch (err: any) {
      toastError(err.message || t('campaigns.deleteError'));
      setIsDeleting(false);
    }
  };

  if (isLoading || !campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const percent =
    campaign.total_recipients > 0
      ? Math.round((campaign.sent_count / campaign.total_recipients) * 100)
      : 0;

  const filteredRecipients = recipients.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (r.person_name && r.person_name.toLowerCase().includes(q)) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.company_name && r.company_name.toLowerCase().includes(q)) ||
        (r.whatsapp_number && r.whatsapp_number.includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in pb-12">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          to="/campaigns"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
          <span>{t('campaignDetail.backToCampaigns')}</span>
        </Link>
      </div>

      {/* Hero Header Card */}
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {campaign.name}
              </h1>
              <Badge
                variant={campaign.channel === 'email' ? 'brand' : 'success'}
                size="sm"
                icon={
                  campaign.channel === 'email' ? (
                    <Mail className="w-3 h-3" />
                  ) : (
                    <MessageSquare className="w-3 h-3" />
                  )
                }
              >
                {campaign.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel')}
              </Badge>
              {campaign.is_dry_run === 1 && (
                <Badge variant="purple" size="sm">
                  Dry Run
                </Badge>
              )}
              <Badge
                variant={
                  campaign.status === 'running'
                    ? 'brand'
                    : campaign.status === 'done'
                    ? 'success'
                    : campaign.status === 'paused'
                    ? 'warning'
                    : campaign.status === 'cancelled'
                    ? 'danger'
                    : 'slate'
                }
                size="sm"
              >
                {campaign.status.toUpperCase()}
              </Badge>
            </div>
            <p className="text-xs text-slate-500">
              {campaign.template_name} • {new Date(campaign.created_at).toLocaleString()}
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3 shrink-0">
            {campaign.status === 'draft' && (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Play className="w-4 h-4" />}
                onClick={handleStart}
              >
                {t('campaignDetail.startCampaign')}
              </Button>
            )}

            {campaign.status === 'running' && (
              <Button
                variant="outline"
                size="md"
                leftIcon={<Pause className="w-4 h-4" />}
                onClick={handlePause}
              >
                {t('campaigns.pause')}
              </Button>
            )}

            {campaign.status === 'paused' && (
              <Button
                variant="success"
                size="md"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={handleResume}
              >
                {t('campaigns.resume')}
              </Button>
            )}

            {['running', 'paused'].includes(campaign.status) && (
              <Button
                variant="danger"
                size="md"
                leftIcon={<Ban className="w-4 h-4" />}
                onClick={handleCancel}
              >
                {t('campaigns.cancel')}
              </Button>
            )}

            <Button
              variant="outline"
              size="md"
              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 border-rose-200 dark:border-rose-900/60"
              leftIcon={<Trash2 className="w-4 h-4" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              {t('campaigns.deleteCampaign')}
            </Button>
          </div>
        </div>

        {/* Live Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
            <span>{t('campaigns.overallProgress')}</span>
            <span>
              {campaign.sent_count} / {campaign.total_recipients} ({percent}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-brand-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] font-semibold text-slate-400">{t('campaigns.totalTargets')}</span>
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {campaign.total_recipients}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
              <span className="text-[11px] font-semibold text-emerald-600">{t('campaigns.dispatched')}</span>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                {campaign.sent_count}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-rose-50/50 dark:bg-rose-950/20">
              <span className="text-[11px] font-semibold text-rose-600">{t('campaigns.failed')}</span>
              <p className="text-lg font-bold text-rose-700 dark:text-rose-300">
                {campaign.failed_count}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-[11px] font-semibold text-slate-400">{t('campaigns.skipped')}</span>
              <p className="text-lg font-bold text-slate-700 dark:text-slate-300">
                {campaign.skipped_count}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Target Recipients Table */}
      <Card className="p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('campaigns.recipientsTableTitle', { count: filteredRecipients.length })}
            </h3>
            <p className="text-xs text-slate-400">{t('campaigns.recipientsTableDesc')}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg ${
                  statusFilter === 'all' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                {t('common.all')}
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-lg ${
                  statusFilter === 'pending' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
                }`}
              >
                {t('campaigns.pending')}
              </button>
              <button
                onClick={() => setStatusFilter('sent')}
                className={`px-2.5 py-1 rounded-lg ${
                  statusFilter === 'sent' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                {t('campaigns.sent')}
              </button>
              <button
                onClick={() => setStatusFilter('failed')}
                className={`px-2.5 py-1 rounded-lg ${
                  statusFilter === 'failed' ? 'bg-white dark:bg-slate-900 text-rose-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                {t('campaigns.failed')}
              </button>
              <button
                onClick={() => setStatusFilter('skipped')}
                className={`px-2.5 py-1 rounded-lg ${
                  statusFilter === 'skipped' ? 'bg-white dark:bg-slate-900 text-slate-600 shadow-xs' : 'text-slate-500'
                }`}
              >
                {t('campaigns.skipped')}
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 rtl:left-auto rtl:right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('common.search')}
                className="pl-8 rtl:pl-3 rtl:pr-8 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs w-44"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3">{t('contacts.colPerson')}</th>
                <th className="py-2.5 px-3">{t('contacts.colCompany')}</th>
                <th className="py-2.5 px-3">{t('logs.colAddress')}</th>
                <th className="py-2.5 px-3">{t('logs.colStatus')}</th>
                <th className="py-2.5 px-3">{t('campaignDetail.sentTime')}</th>
                <th className="py-2.5 px-3">{t('campaignDetail.diagnosticNotes')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredRecipients.map((rec) => (
                <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                    {rec.person_name || t('contacts.anonymousContact')}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {rec.company_name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300" dir="ltr">
                    {campaign.channel === 'email' ? rec.email : rec.whatsapp_number || rec.phone_mobile}
                  </td>
                  <td className="py-2.5 px-3">
                    <Badge
                      variant={
                        rec.status === 'sent'
                          ? 'success'
                          : rec.status === 'failed'
                          ? 'danger'
                          : rec.status === 'skipped'
                          ? 'warning'
                          : 'slate'
                      }
                      size="sm"
                    >
                      {rec.status.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-slate-400">
                    {rec.sent_at ? new Date(rec.sent_at).toLocaleTimeString() : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate">
                    {rec.error || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Campaign Confirmation Modal */}
      {isDeleteModalOpen && campaign && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
          title={t('campaigns.confirmDeleteTitle')}
          maxWidth="sm"
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-medium">
                {campaign.status === 'running'
                  ? t('campaigns.confirmDeleteRunningDesc')
                  : t('campaigns.confirmDeleteDesc', { name: campaign.name })}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl text-xs space-y-1.5 text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-800">
              <div className="font-extrabold text-slate-900 dark:text-white text-sm">
                {campaign.name}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={campaign.channel === 'email' ? 'brand' : 'success'} size="sm">
                  {campaign.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel')}
                </Badge>
                <span>•</span>
                <span>{campaign.total_recipients || 0} {t('campaigns.totalTargets')}</span>
                <span>•</span>
                <span className="uppercase font-semibold">{campaign.status}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
              >
                {t('common.cancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 className="w-4 h-4" />}
                isLoading={isDeleting}
                onClick={handleDelete}
              >
                {t('campaigns.deleteCampaign')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

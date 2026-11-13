import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Send,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Ban,
  Mail,
  MessageSquare,
  Eye,
  CheckCircle2,
  AlertCircle,
  Shield,
  Layers,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Campaign, Template, Contact } from '../types';

export const Campaigns: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4>(1);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    channel: 'email' as 'email' | 'whatsapp',
    template_id: 0,
    is_dry_run: false,
    selectedContactIds: [] as number[],
  });

  // Test Send Modal State
  const [isTestSendOpen, setIsTestSendOpen] = useState(false);
  const [testSendRecipient, setTestSendRecipient] = useState('');
  const [testSendTemplateId, setTestSendTemplateId] = useState<number>(0);
  const [testSendChannel, setTestSendChannel] = useState<'email' | 'whatsapp'>('email');
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    loadAll();
    if (searchParams.get('action') === 'new') {
      openNewCampaignWizard();
      setSearchParams({});
    }
  }, []);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [campRes, tmplRes, contRes] = await Promise.all([
        api.getCampaigns(),
        api.getTemplates(),
        api.getContacts(),
      ]);
      setCampaigns(campRes.campaigns);
      setTemplates(tmplRes.templates);
      setContacts(contRes.contacts);
    } catch (err: any) {
      toastError(err.message || 'Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const openNewCampaignWizard = () => {
    setNewCampaign({
      name: `Outreach Campaign #${campaigns.length + 1}`,
      channel: 'email',
      template_id: templates[0]?.id || 0,
      is_dry_run: false,
      selectedContactIds: [],
    });
    setWizardStep(1);
    setIsWizardOpen(true);
  };

  const handleStartCampaign = async (id: number) => {
    try {
      await api.startCampaign(id);
      toastSuccess('Campaign launched into background queue!');
      loadAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to start campaign');
    }
  };

  const handlePauseCampaign = async (id: number) => {
    try {
      await api.pauseCampaign(id);
      toastSuccess('Campaign paused');
      loadAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to pause');
    }
  };

  const handleResumeCampaign = async (id: number) => {
    try {
      await api.resumeCampaign(id);
      toastSuccess('Campaign resumed');
      loadAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to resume');
    }
  };

  const handleCancelCampaign = async (id: number) => {
    if (!confirm('Are you sure you want to cancel this campaign?')) return;
    try {
      await api.cancelCampaign(id);
      toastSuccess('Campaign cancelled');
      loadAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to cancel');
    }
  };

  const handleCreateCampaignSubmit = async () => {
    if (!newCampaign.name || !newCampaign.template_id || newCampaign.selectedContactIds.length === 0) {
      toastError('Please fill all required campaign fields and select recipients.');
      return;
    }

    try {
      const res = await api.createCampaign({
        name: newCampaign.name,
        channel: newCampaign.channel,
        template_id: newCampaign.template_id,
        is_dry_run: newCampaign.is_dry_run,
        contact_ids: newCampaign.selectedContactIds,
      });

      toastSuccess('Campaign created successfully!');
      setIsWizardOpen(false);
      loadAll();
    } catch (err: any) {
      toastError(err.message || 'Failed to create campaign');
    }
  };

  const handleTriggerTestSend = async () => {
    if (!testSendRecipient || !testSendTemplateId) {
      toastError('Please specify recipient and template');
      return;
    }

    setIsSendingTest(true);
    try {
      const res = await api.testSend({
        channel: testSendChannel,
        template_id: testSendTemplateId,
        recipient_address: testSendRecipient,
      });

      if (res.clickToChatUrl) {
        window.open(res.clickToChatUrl, '_blank');
        toastSuccess('Click-to-chat window opened in browser!');
      } else {
        toastSuccess(res.message);
      }
      setIsTestSendOpen(false);
    } catch (err: any) {
      toastError(err.message || 'Test send failed');
    } finally {
      setIsSendingTest(false);
    }
  };

  // Candidates for Wizard Recipient Selection (Strict Address Deduplication)
  const eligibleContacts = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Contact[] = [];

    for (const c of contacts) {
      if (c.opted_out === 1) continue;
      const addr = newCampaign.channel === 'email'
        ? (c.email ? c.email.trim().toLowerCase() : null)
        : (c.whatsapp_number || c.phone_mobile ? String(c.whatsapp_number || c.phone_mobile).replace(/\D/g, '') : null);

      if (!addr) continue;
      if (newCampaign.channel === 'email' && !addr.includes('@')) continue;

      if (!seen.has(addr)) {
        seen.add(addr);
        result.push(c);
      }
    }
    return result;
  }, [contacts, newCampaign.channel]);

  const selectAllEligible = () => {
    setNewCampaign((prev) => ({
      ...prev,
      selectedContactIds: eligibleContacts.map((c) => c.id),
    }));
  };

  const deselectAll = () => {
    setNewCampaign((prev) => ({ ...prev, selectedContactIds: [] }));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('campaigns.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('campaigns.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('ai.antiBanActive')}</span>
          </div>

          <Button
            variant="outline"
            size="md"
            onClick={() => {
              setTestSendChannel('email');
              setTestSendTemplateId(templates[0]?.id || 0);
              setIsTestSendOpen(true);
            }}
          >
            {t('campaigns.sendTest')}
          </Button>

          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={openNewCampaignWizard}
          >
            {t('campaigns.newCampaign')}
          </Button>
        </div>
      </div>

      {/* Circuit Breaker & Safety Pauses Banner */}
      {campaigns
        .filter((c) => c.status === 'paused' && c.pause_reason)
        .map((pc) => (
          <div
            key={pc.id}
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in shadow-sm"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm">{t('ai.circuitBreakerAlert')}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-900 dark:text-amber-100 font-mono">
                    {pc.name}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300 mt-1">
                  {pc.pause_reason}
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => handleResumeCampaign(pc.id)}
              leftIcon={<Play className="w-3.5 h-3.5" />}
            >
              {t('ai.resumeCampaign')}
            </Button>
          </div>
        ))}

      {/* Campaigns List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="p-12 text-center">
          <Send className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t('campaigns.noCampaignsTitle')}</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            {t('campaigns.noCampaignsDesc')}
          </p>
          <Button variant="primary" size="sm" onClick={openNewCampaignWizard}>
            {t('campaigns.createWizard')}
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {campaigns.map((camp) => {
            const percent =
              camp.total_recipients > 0
                ? Math.round((camp.sent_count / camp.total_recipients) * 100)
                : 0;

            return (
              <Card key={camp.id} className="p-5 sm:p-6" hoverEffect>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  {/* Left: Info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/campaigns/${camp.id}`}
                        className="text-base font-extrabold text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                      >
                        {camp.name}
                      </Link>

                      <Badge
                        variant={camp.channel === 'email' ? 'brand' : 'success'}
                        size="sm"
                        icon={
                          camp.channel === 'email' ? (
                            <Mail className="w-3 h-3" />
                          ) : (
                            <MessageSquare className="w-3 h-3" />
                          )
                        }
                      >
                        {camp.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel')}
                      </Badge>

                      {camp.is_dry_run === 1 && (
                        <Badge variant="purple" size="sm">
                          Dry Run
                        </Badge>
                      )}

                      <Badge
                        variant={
                          camp.status === 'running'
                            ? 'brand'
                            : camp.status === 'done'
                            ? 'success'
                            : camp.status === 'paused'
                            ? 'warning'
                            : camp.status === 'cancelled'
                            ? 'danger'
                            : 'slate'
                        }
                        size="sm"
                      >
                        {camp.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span>{camp.template_name || 'Standard'}</span>
                      <span>•</span>
                      <span>{new Date(camp.created_at).toLocaleDateString()}</span>
                      {camp.started_at && (
                        <>
                          <span>•</span>
                          <span>{new Date(camp.started_at).toLocaleTimeString()}</span>
                        </>
                      )}
                    </div>

                    {camp.pause_reason && camp.status === 'paused' && (
                      <div className="mt-2 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600 mt-0.5" />
                        <span>{camp.pause_reason}</span>
                      </div>
                    )}
                  </div>

                  {/* Middle: Progress Telemetry */}
                  <div className="w-full lg:w-64 space-y-1.5 shrink-0">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <span>
                        {camp.sent_count} / {camp.total_recipients} {t('campaigns.dispatched')}
                      </span>
                      <span>{percent}%</span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                      <div
                        className="bg-brand-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>{camp.failed_count} {t('campaigns.failed')}</span>
                      <span>{camp.skipped_count} {t('campaigns.skipped')}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {camp.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="primary"
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                        onClick={() => handleStartCampaign(camp.id)}
                      >
                        {t('campaigns.launch')}
                      </Button>
                    )}

                    {camp.status === 'running' && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<Pause className="w-3.5 h-3.5" />}
                        onClick={() => handlePauseCampaign(camp.id)}
                      >
                        {t('campaigns.pause')}
                      </Button>
                    )}

                    {camp.status === 'paused' && (
                      <Button
                        size="sm"
                        variant="success"
                        leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                        onClick={() => handleResumeCampaign(camp.id)}
                      >
                        {t('campaigns.resume')}
                      </Button>
                    )}

                    {['running', 'paused'].includes(camp.status) && (
                      <Button
                        size="sm"
                        variant="danger"
                        leftIcon={<Ban className="w-3.5 h-3.5" />}
                        onClick={() => handleCancelCampaign(camp.id)}
                      >
                        {t('campaigns.cancel')}
                      </Button>
                    )}

                    <Link to={`/campaigns/${camp.id}`}>
                      <Button size="sm" variant="ghost" leftIcon={<Eye className="w-3.5 h-3.5" />}>
                        {t('campaigns.details')}
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Campaign Creation Wizard Modal */}
      {isWizardOpen && (
        <Modal
          isOpen={isWizardOpen}
          onClose={() => setIsWizardOpen(false)}
          title={t('campaigns.wizardTitle')}
          description={t('campaigns.wizardStepIndicator', {
            step: wizardStep,
            title:
              wizardStep === 1
                ? t('campaigns.step1Title')
                : wizardStep === 2
                ? t('campaigns.step2Title')
                : wizardStep === 3
                ? t('campaigns.step3Title')
                : t('campaigns.step4Title'),
          })}
          maxWidth="xl"
        >
          <div className="space-y-5">
            {/* Step 1: Basics */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('campaigns.campaignNameLabel')}
                  </label>
                  <input
                    type="text"
                    value={newCampaign.name}
                    onChange={(e) => setNewCampaign({ ...newCampaign, name: e.target.value })}
                    placeholder="e.g. Cairo ICT 2026 Tech Follow-up"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {t('templates.channel')}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setNewCampaign({
                          ...newCampaign,
                          channel: 'email',
                          selectedContactIds: [],
                        })
                      }
                      className={`p-3 rounded-xl border text-left rtl:text-right flex items-start gap-3 transition-all ${
                        newCampaign.channel === 'email'
                          ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 text-brand-900 dark:text-brand-100 ring-2 ring-brand-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <Mail className="w-5 h-5 text-brand-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">{t('campaigns.emailChannelTitle')}</div>
                        <div className="text-[11px] text-slate-500">
                          {t('campaigns.emailChannelSubtitle')}
                        </div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNewCampaign({
                          ...newCampaign,
                          channel: 'whatsapp',
                          selectedContactIds: [],
                        })
                      }
                      className={`p-3 rounded-xl border text-left rtl:text-right flex items-start gap-3 transition-all ${
                        newCampaign.channel === 'whatsapp'
                          ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 ring-2 ring-emerald-500'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600'
                      }`}
                    >
                      <MessageSquare className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div>
                        <div className="font-bold text-xs">{t('campaigns.whatsAppChannelTitle')}</div>
                        <div className="text-[11px] text-slate-500">
                          {t('campaigns.whatsAppChannelSubtitle')}
                        </div>
                      </div>
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-950/20">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newCampaign.is_dry_run}
                      onChange={(e) =>
                        setNewCampaign({ ...newCampaign, is_dry_run: e.target.checked })
                      }
                      className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                    />
                    <div>
                      <span className="text-xs font-bold text-purple-900 dark:text-purple-200">
                        {t('campaigns.enableDryRunTitle')}
                      </span>
                      <p className="text-[11px] text-purple-700 dark:text-purple-300">
                        {t('campaigns.enableDryRunSubtitle')}
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Choose Template */}
            {wizardStep === 2 && (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('campaigns.selectTemplateLabel', {
                    channel: newCampaign.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel')
                  })}
                </label>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {templates
                    .filter((t) => t.channel === newCampaign.channel)
                    .map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setNewCampaign({ ...newCampaign, template_id: tmpl.id })}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          newCampaign.template_id === tmpl.id
                            ? 'border-brand-500 bg-brand-50 dark:bg-brand-950/40 ring-2 ring-brand-500'
                            : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {tmpl.name}
                        </div>
                        {tmpl.subject && (
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            {t('templates.emailSubject')}: {tmpl.subject}
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 mt-1 font-mono line-clamp-2">
                          {tmpl.body.replace(/<[^>]+>/g, ' ')}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Step 3: Choose Recipients */}
            {wizardStep === 3 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {t('campaigns.selectedRecipientsCount', {
                      selected: newCampaign.selectedContactIds.length,
                      eligible: eligibleContacts.length
                    })}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllEligible}
                      className="text-brand-600 font-semibold hover:underline"
                    >
                      {t('campaigns.selectAll')}
                    </button>
                    <span>•</span>
                    <button
                      onClick={deselectAll}
                      className="text-slate-500 hover:underline"
                    >
                      {t('campaigns.deselectAll')}
                    </button>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                  {eligibleContacts.map((c) => {
                    const isSelected = newCampaign.selectedContactIds.includes(c.id);
                    return (
                      <div
                        key={c.id}
                        onClick={() => {
                          setNewCampaign((prev) => ({
                            ...prev,
                            selectedContactIds: isSelected
                              ? prev.selectedContactIds.filter((id) => id !== c.id)
                              : [...prev.selectedContactIds, c.id],
                          }));
                        }}
                        className={`p-2.5 flex items-center justify-between text-xs cursor-pointer ${
                          isSelected ? 'bg-brand-50/40 dark:bg-brand-950/20' : ''
                        }`}
                      >
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {c.person_name || t('contacts.anonymousContact')}
                          </span>{' '}
                          <span className="text-slate-500">({c.company_name})</span>
                          <div className="text-[11px] text-slate-400 font-mono" dir="ltr">
                            {newCampaign.channel === 'email' ? c.email : c.whatsapp_number || c.phone_mobile}
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Safety & Review Confirmation */}
            {wizardStep === 4 && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('campaigns.campaignNameLabel')}:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{newCampaign.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('templates.channel')}:</span>
                    <span className="font-bold uppercase text-brand-600">
                      {newCampaign.channel === 'email' ? t('templates.emailChannel') : t('templates.whatsAppChannel')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('campaigns.totalTargets')}:</span>
                    <span className="font-bold">{newCampaign.selectedContactIds.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t('common.status')}:</span>
                    <span className="font-bold">
                      {newCampaign.is_dry_run ? 'Dry Run' : 'Real Delivery'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:text-emerald-200 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    <span>{t('campaigns.safeAssurancesTitle')}</span>
                  </div>
                  <ul className="list-disc list-inside text-[11px] space-y-0.5 text-emerald-800 dark:text-emerald-300">
                    <li>{t('campaigns.safeAssurance1')}</li>
                    <li>{t('campaigns.safeAssurance2')}</li>
                    <li>{t('campaigns.safeAssurance3')}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between">
              {wizardStep > 1 ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setWizardStep((prev) => (prev - 1) as any)}
                >
                  {t('campaigns.back')}
                </Button>
              ) : (
                <div />
              )}

              {wizardStep < 4 ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    if (wizardStep === 1 && !newCampaign.name) {
                      toastError('Please enter a campaign name');
                      return;
                    }
                    if (wizardStep === 2 && !newCampaign.template_id) {
                      toastError('Please select a template');
                      return;
                    }
                    if (wizardStep === 3 && newCampaign.selectedContactIds.length === 0) {
                      toastError('Please select at least one recipient');
                      return;
                    }
                    setWizardStep((prev) => (prev + 1) as any);
                  }}
                >
                  {t('campaigns.nextStep')}
                </Button>
              ) : (
                <Button size="sm" variant="primary" onClick={handleCreateCampaignSubmit}>
                  {t('campaigns.confirmAndCreate')}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Test Send Modal */}
      {isTestSendOpen && (
        <Modal
          isOpen={isTestSendOpen}
          onClose={() => setIsTestSendOpen(false)}
          title={t('campaigns.sendTestModalTitle')}
          description={t('campaigns.sendTestModalDesc')}
          maxWidth="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('templates.channel')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTestSendChannel('email')}
                  className={`py-1.5 text-xs font-bold rounded-lg border ${
                    testSendChannel === 'email' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200'
                  }`}
                >
                  {t('templates.emailChannel')}
                </button>
                <button
                  type="button"
                  onClick={() => setTestSendChannel('whatsapp')}
                  className={`py-1.5 text-xs font-bold rounded-lg border ${
                    testSendChannel === 'whatsapp' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200'
                  }`}
                >
                  {t('templates.whatsAppChannel')}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('nav.templates')}
              </label>
              <select
                value={testSendTemplateId}
                onChange={(e) => setTestSendTemplateId(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              >
                {templates
                  .filter((t) => t.channel === testSendChannel)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('campaigns.recipientAddressLabel', {
                  label: testSendChannel === 'email' ? 'Email Address' : 'WhatsApp Number (E.164)'
                })}
              </label>
              <input
                type="text"
                value={testSendRecipient}
                onChange={(e) => setTestSendRecipient(e.target.value)}
                placeholder={testSendChannel === 'email' ? 'youremail@domain.com' : '+201012345678'}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
              <Button size="sm" variant="outline" onClick={() => setIsTestSendOpen(false)}>
                {t('common.cancel')}
              </Button>
              <Button size="sm" variant="primary" isLoading={isSendingTest} onClick={handleTriggerTestSend}>
                {t('campaigns.dispatchTest')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

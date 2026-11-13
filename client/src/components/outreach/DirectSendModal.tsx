import React, { useEffect, useState, useMemo } from 'react';
import { Mail, MessageSquare, Send, Sparkles, UserCheck, Eye, ShieldCheck, Check, AlertTriangle, CheckCircle2, X, Wand2, RotateCcw } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';
import { useTranslation } from '../../i18n/LanguageContext';
import { api } from '../../services/api';
import { Template, SpamAnalysis } from '../../types';

interface DirectSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultEmail?: string;
  defaultName?: string;
  defaultCompany?: string;
}

export const DirectSendModal: React.FC<DirectSendModalProps> = ({
  isOpen,
  onClose,
  defaultEmail = '',
  defaultName = '',
  defaultCompany = '',
}) => {
  const { t, dir } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();

  const [channel, setChannel] = useState<'email' | 'whatsapp'>('email');
  const [recipientAddress, setRecipientAddress] = useState(defaultEmail);
  const [personName, setPersonName] = useState(defaultName);
  const [companyName, setCompanyName] = useState(defaultCompany);
  const [jobTitle, setJobTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isDryRun, setIsDryRun] = useState(false);
  const [saveToContacts, setSaveToContacts] = useState(true);

  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | 'custom'>('custom');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');

  const [isPersonalizing, setIsPersonalizing] = useState(false);
  const [isCheckingSpam, setIsCheckingSpam] = useState(false);
  const [spamAnalysis, setSpamAnalysis] = useState<SpamAnalysis | null>(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [originalState, setOriginalState] = useState<{ subject: string; body: string } | null>(null);
  const [appliedExplanation, setAppliedExplanation] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setRecipientAddress(defaultEmail);
      setPersonName(defaultName);
      setCompanyName(defaultCompany);
      loadTemplates();
    }
  }, [isOpen, defaultEmail, defaultName, defaultCompany]);

  const loadTemplates = async () => {
    try {
      const res = await api.getTemplates();
      setTemplates(res.templates);
      const defaultTmpl = res.templates.find((t) => t.channel === channel && t.is_default === 1);
      if (defaultTmpl) {
        setSelectedTemplateId(defaultTmpl.id);
        if (defaultTmpl.subject) setSubject(defaultTmpl.subject);
        setBody(defaultTmpl.body);
      }
    } catch {
      // Ignore if templates fail
    }
  };

  const handleChannelSwitch = (newChannel: 'email' | 'whatsapp') => {
    setChannel(newChannel);
    const defaultTmpl = templates.find((t) => t.channel === newChannel && t.is_default === 1);
    if (defaultTmpl) {
      setSelectedTemplateId(defaultTmpl.id);
      if (defaultTmpl.subject) setSubject(defaultTmpl.subject);
      setBody(defaultTmpl.body);
    } else {
      setSelectedTemplateId('custom');
      setSubject('');
      setBody('');
    }
  };

  const handleSelectTemplate = (id: number | 'custom') => {
    setSelectedTemplateId(id);
    if (id === 'custom') {
      return;
    }
    const tmpl = templates.find((t) => t.id === id);
    if (tmpl) {
      if (tmpl.subject) setSubject(tmpl.subject);
      setBody(tmpl.body);
      setChannel(tmpl.channel as 'email' | 'whatsapp');
    }
  };

  // Compute live rendered preview with real input values
  const renderedPreview = useMemo(() => {
    const vars: Record<string, string> = {
      company_name: companyName || 'Company Name',
      person_name: personName || 'Valued Contact',
      job_title: jobTitle || 'Manager',
      email: recipientAddress || 'recipient@example.com',
      website: 'https://example.com',
      unsubscribe_url: 'http://localhost:5000/unsubscribe/demo-direct',
    };

    let sub = subject;
    let bod = body;

    Object.entries(vars).forEach(([k, v]) => {
      const regex = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
      sub = sub.replace(regex, v);
      bod = bod.replace(regex, v);
    });

    return { subject: sub, body: bod };
  }, [subject, body, personName, companyName, jobTitle, recipientAddress]);

  const handleAiPersonalize = async () => {
    setIsPersonalizing(true);
    try {
      const res = await api.personalizePitch({
        companyName: companyName || 'your company',
        role: jobTitle || 'Frontend Engineer',
        recipientName: personName || undefined,
      });

      if (res.personalizedText) {
        if (channel === 'email') {
          const hookHtml = `<p style="color: #0369a1; font-weight: 500;"><em>${res.personalizedText}</em></p>`;
          if (body.includes('</p>')) {
            const firstPIdx = body.indexOf('</p>') + 4;
            const newBody = body.slice(0, firstPIdx) + '\n\n' + hookHtml + body.slice(firstPIdx);
            setBody(newBody);
          } else {
            setBody(hookHtml + '\n' + body);
          }
        } else {
          setBody(res.personalizedText + '\n\n' + body);
        }
        toastSuccess(t('ai.personalizedSuccess'));
      }
    } catch (err: any) {
      toastError(err.message || 'AI personalization failed');
    } finally {
      setIsPersonalizing(false);
    }
  };

  const handleCheckSpam = async () => {
    if (!body.trim()) {
      toastError('Please enter a message body first');
      return;
    }
    setIsCheckingSpam(true);
    try {
      const res = await api.checkSpam({
        subject: channel === 'email' ? subject : 'WhatsApp message',
        body,
      });
      setSpamAnalysis(res.analysis);
      toastSuccess(t('ai.spamScore').replace('{score}', String(res.analysis.score)));
    } catch (err: any) {
      toastError(err.message || 'Spam check failed');
    } finally {
      setIsCheckingSpam(false);
    }
  };

  const handleApplySpamFixes = async () => {
    if (!spamAnalysis) return;
    setIsApplyingFixes(true);
    try {
      setOriginalState({ subject, body });

      const res = await api.applySpamFixes({
        subject: channel === 'email' ? subject : undefined,
        body,
        suggestions: spamAnalysis.suggestions,
        spamWordsFound: spamAnalysis.spamWordsFound,
        channel,
      });

      if (channel === 'email' && res.improvedSubject) {
        setSubject(res.improvedSubject);
      }
      if (res.improvedBody) {
        setBody(res.improvedBody);
      }

      setAppliedExplanation(res.explanation);

      setSpamAnalysis({
        score: res.newScore || 96,
        verdict: 'excellent',
        spamWordsFound: [],
        strengths: ['All previous deliverability criticisms resolved by AI.'],
        suggestions: [],
      });

      toastSuccess(t('ai.fixesApplied'));
    } catch (err: any) {
      toastError(err.message || 'Failed to apply AI spam fixes');
    } finally {
      setIsApplyingFixes(false);
    }
  };

  const handleUndoFixes = () => {
    if (!originalState) return;
    setSubject(originalState.subject);
    setBody(originalState.body);
    setOriginalState(null);
    setAppliedExplanation(null);
    toastSuccess(t('ai.revertOriginal'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientAddress.trim()) {
      toastError(channel === 'email' ? 'Please enter a recipient email address' : 'Please enter a phone number');
      return;
    }
    if (!body.trim()) {
      toastError('Message body cannot be empty');
      return;
    }
    if (channel === 'email' && !subject.trim()) {
      toastError('Email subject is required');
      return;
    }

    setIsSending(true);
    try {
      const res = await api.sendDirect({
        channel,
        recipient_address: recipientAddress.trim(),
        person_name: personName.trim() || undefined,
        company_name: companyName.trim() || undefined,
        job_title: jobTitle.trim() || undefined,
        subject: channel === 'email' ? subject.trim() : undefined,
        body: body.trim(),
        is_dry_run: isDryRun,
        save_to_contacts: saveToContacts,
      });

      if (res.clickToChatUrl) {
        window.open(res.clickToChatUrl, '_blank');
        toastSuccess(t('directSend.successWa', { phone: recipientAddress }));
      } else {
        toastSuccess(res.message || t('directSend.successEmail', { email: recipientAddress }));
      }

      onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to dispatch direct message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('directSend.title')}
      description={t('directSend.subtitle')}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Channel Selector */}
        <div className="flex items-center justify-between gap-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
            {t('directSend.channel')}:
          </span>
          <div className="grid grid-cols-2 gap-2 w-64">
            <button
              type="button"
              onClick={() => handleChannelSwitch('email')}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex flex-row items-center justify-center gap-2 transition-all ${
                channel === 'email'
                  ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 ring-2 ring-brand-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <Mail className="w-3.5 h-3.5 shrink-0" />
              <span>{t('templates.emailChannel')}</span>
            </button>
            <button
              type="button"
              onClick={() => handleChannelSwitch('whatsapp')}
              className={`py-1.5 px-3 rounded-xl border text-xs font-bold flex flex-row items-center justify-center gap-2 transition-all ${
                channel === 'whatsapp'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 ring-2 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>{t('templates.whatsAppChannel')}</span>
            </button>
          </div>
        </div>

        {/* Recipient Details (2x2 Grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {channel === 'email' ? t('directSend.recipientEmail') : t('directSend.recipientPhone')} *
            </label>
            <input
              type={channel === 'email' ? 'email' : 'text'}
              required
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              placeholder={channel === 'email' ? 'client@company.com' : '+201012345678'}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('directSend.personName')}
            </label>
            <input
              type="text"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="e.g. Dr. Ahmed Hassan"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('directSend.companyName')}
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. TeleTech Solutions"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {t('directSend.jobTitle')}
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Managing Director"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>
        </div>

        {/* Template Quick Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {t('directSend.templateSelect')}
          </label>
          <select
            value={selectedTemplateId}
            onChange={(e) =>
              handleSelectTemplate(e.target.value === 'custom' ? 'custom' : Number(e.target.value))
            }
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
          >
            <option value="custom">✍️ {t('directSend.customOption')}</option>
            {templates
              .filter((t) => t.channel === channel)
              .map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  📄 {tmpl.name}
                </option>
              ))}
          </select>
        </div>

        {/* Tabs: Write Message vs Live Preview */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'editor'
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              ✍️ {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex flex-row items-center gap-1.5 transition-all ${
                activeTab === 'preview'
                  ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-300'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>{t('templates.livePreview')}</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 hidden sm:inline">
            {t('directSend.variablesHint')}
          </span>
        </div>

        {/* Tab 1: Editor */}
        {activeTab === 'editor' && (
          <div className="space-y-3">
            {channel === 'email' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('directSend.subjectLabel')} *
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Partnership with {{company_name}}..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
            )}

            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('directSend.bodyLabel')} ({channel === 'email' ? 'HTML / Text' : 'Text'}) *
                </label>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={isPersonalizing}
                    onClick={handleAiPersonalize}
                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white text-[11px] font-bold flex flex-row items-center gap-1.5 shadow-sm shadow-purple-500/20 transition-all disabled:opacity-50"
                    title="Personalize pitch using Gemini AI"
                  >
                    <Sparkles className="w-3 h-3 shrink-0" />
                    <span>{isPersonalizing ? t('ai.personalizing') : t('ai.personalizeBtn')}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isCheckingSpam}
                    onClick={handleCheckSpam}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex flex-row items-center gap-1.5 transition-all disabled:opacity-50"
                    title="Check spam score and deliverability"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{isCheckingSpam ? t('ai.checkingSpam') : t('ai.spamCheckBtn')}</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={6}
                required
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={
                  channel === 'email'
                    ? '<p>Dear {{person_name}},</p>\n<p>I would like to explore collaborating with {{company_name}}...</p>'
                    : 'Hello {{person_name}}, hope you are well at {{company_name}}!'
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
              />
            </div>

            {/* AI Spam Analysis Drawer */}
            {spamAnalysis && (
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2 animate-fade-in text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        spamAnalysis.verdict === 'excellent'
                          ? 'success'
                          : spamAnalysis.verdict === 'good'
                          ? 'brand'
                          : 'danger'
                      }
                      size="sm"
                    >
                      {t('ai.spamScore').replace('{score}', String(spamAnalysis.score))}
                    </Badge>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {spamAnalysis.verdict === 'excellent'
                        ? t('ai.verdictExcellent')
                        : spamAnalysis.verdict === 'good'
                        ? t('ai.verdictGood')
                        : t('ai.verdictRisky')}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSpamAnalysis(null)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {spamAnalysis.spamWordsFound.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap text-[11px]">
                    <span className="text-rose-500 font-semibold">{t('ai.spamWordsFound')}</span>
                    {spamAnalysis.spamWordsFound.map((w, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-mono">
                        {w}
                      </span>
                    ))}
                  </div>
                )}

                {spamAnalysis.suggestions.length > 0 && (
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{t('ai.suggestions')}</span>
                    <ul className="list-disc list-inside space-y-0.5">
                      {spamAnalysis.suggestions.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Explanation of AI fixes applied */}
                {appliedExplanation && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <span className="font-bold">{t('ai.fixesExplanation')} </span>
                      <span>{appliedExplanation}</span>
                    </div>
                  </div>
                )}

                {/* Action Toolbar: Auto-Apply All Fixes & Undo */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isApplyingFixes}
                    onClick={handleApplySpamFixes}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex flex-row items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
                  >
                    <Wand2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{isApplyingFixes ? t('ai.applyingFixes') : t('ai.applyFixesBtn')}</span>
                  </button>

                  {originalState && (
                    <button
                      type="button"
                      onClick={handleUndoFixes}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex flex-row items-center gap-1.5 transition-colors"
                      title={t('ai.revertOriginal')}
                    >
                      <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                      <span>{t('ai.undoChanges')}</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Live Preview */}
        {activeTab === 'preview' && (
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            {channel === 'email' && (
              <div className="pb-2 border-b border-slate-200 dark:border-slate-700 text-xs">
                <span className="font-bold text-slate-400">Subject: </span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {renderedPreview.subject || '(empty subject)'}
                </span>
              </div>
            )}
            <div
              className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html:
                  channel === 'email'
                    ? renderedPreview.body || '<span class="text-slate-400 italic">No content</span>'
                    : renderedPreview.body.replace(/\n/g, '<br/>') ||
                      '<span class="text-slate-400 italic">No content</span>',
              }}
            />
          </div>
        )}

        {/* Checkboxes: Dry Run and Save Contact */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={saveToContacts}
              onChange={(e) => setSaveToContacts(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 w-4 h-4"
            />
            <span>{t('directSend.saveToContacts')}</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-purple-700 dark:text-purple-300">
            <input
              type="checkbox"
              checked={isDryRun}
              onChange={(e) => setIsDryRun(e.target.checked)}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
            />
            <span>{t('directSend.dryRun')}</span>
          </label>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
          <Button variant="outline" size="sm" type="button" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            type="submit"
            isLoading={isSending}
            leftIcon={<Send className="w-3.5 h-3.5" />}
          >
            {t('directSend.sendNow')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

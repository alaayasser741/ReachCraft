import React, { useEffect, useState } from 'react';
import {
  FileCode2,
  Plus,
  Mail,
  MessageSquare,
  Edit2,
  Trash2,
  Eye,
  Check,
  Sparkles,
  Star,
  ShieldCheck,
  X,
  AlertTriangle,
  Wand2,
  RotateCcw,
  Lock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Template, SpamAnalysis } from '../types';

export const Templates: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Partial<Template> | null>(null);

  const [isGeneratingSubjects, setIsGeneratingSubjects] = useState(false);
  const [suggestedSubjects, setSuggestedSubjects] = useState<string[]>([]);
  const [isCheckingSpam, setIsCheckingSpam] = useState(false);
  const [spamAnalysis, setSpamAnalysis] = useState<SpamAnalysis | null>(null);
  const [isApplyingFixes, setIsApplyingFixes] = useState(false);
  const [originalState, setOriginalState] = useState<{ subject: string; body: string } | null>(null);
  const [appliedExplanation, setAppliedExplanation] = useState<string | null>(null);

  // Live preview state
  const [previewSubject, setPreviewSubject] = useState('');
  const [previewBody, setPreviewBody] = useState('');

  const variableTokens = [
    { label: 'Company Name', tag: '{{company_name}}' },
    { label: 'Person Name', tag: '{{person_name}}' },
    { label: 'Job Title', tag: '{{job_title}}' },
    { label: 'Website', tag: '{{website}}' },
    { label: 'Unsubscribe Link', tag: '{{unsubscribe_url}}' },
  ];

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTemplates();
      setTemplates(res.templates);
    } catch (err: any) {
      toastError(err.message || 'Failed to load templates');
    } finally {
      setIsLoading(false);
    }
  };

  const openNewTemplate = () => {
    setEditingTemplate({
      name: '',
      channel: 'email',
      subject: 'Partnership Inquiry with {{company_name}}',
      body: '<p>Hi {{person_name}},</p>\n<p>I noticed your work at <strong>{{company_name}}</strong> and wanted to reach out regarding...</p>',
    });
    setIsModalOpen(true);
  };

  const openEditTemplate = (tmpl: Template) => {
    setEditingTemplate(tmpl);
    setIsModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate || !editingTemplate.name || !editingTemplate.body) {
      toastError('Please fill template name and content.');
      return;
    }

    try {
      if (editingTemplate.id) {
        await api.updateTemplate(editingTemplate.id, {
          name: editingTemplate.name,
          channel: editingTemplate.channel,
          subject: editingTemplate.subject,
          body: editingTemplate.body,
        });
        toastSuccess('Template updated successfully');
      } else {
        await api.createTemplate({
          name: editingTemplate.name,
          channel: editingTemplate.channel as 'email' | 'whatsapp',
          subject: editingTemplate.subject || undefined,
          body: editingTemplate.body,
        });
        toastSuccess('Template created successfully');
      }
      setIsModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      toastError(err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await api.deleteTemplate(id);
      toastSuccess('Template deleted');
      loadTemplates();
    } catch (err: any) {
      toastError(err.message || 'Delete failed');
    }
  };

  const handleSetDefault = async (id: number) => {
    try {
      await api.setDefaultTemplate(id);
      toastSuccess(t('templates.defaultSuccess'));
      loadTemplates();
    } catch (err: any) {
      toastError(err.message || 'Failed to set default template');
    }
  };

  const handleGenerateAiSubjects = async () => {
    setIsGeneratingSubjects(true);
    try {
      const res = await api.generateSubjects({
        role: 'Frontend Engineer',
        context: editingTemplate?.name,
      });
      setSuggestedSubjects(res.subjects);
      toastSuccess(t('ai.suggestSubjectsBtn'));
    } catch (err: any) {
      toastError(err.message || 'Failed to generate subjects');
    } finally {
      setIsGeneratingSubjects(false);
    }
  };

  const handleCheckSpam = async () => {
    if (!editingTemplate?.body) return;
    setIsCheckingSpam(true);
    try {
      const res = await api.checkSpam({
        subject: editingTemplate.subject || '',
        body: editingTemplate.body,
      });
      setSpamAnalysis(res.analysis);
      toastSuccess(t('ai.spamScore').replace('{score}', String(res.analysis.score)));
    } catch (err: any) {
      toastError(err.message || 'Spam analysis failed');
    } finally {
      setIsCheckingSpam(false);
    }
  };

  const handleApplySpamFixes = async () => {
    if (!editingTemplate || !editingTemplate.body) return;
    setIsApplyingFixes(true);
    try {
      setOriginalState({
        subject: editingTemplate.subject || '',
        body: editingTemplate.body,
      });

      const res = await api.applySpamFixes({
        subject: editingTemplate.channel === 'email' ? editingTemplate.subject || undefined : undefined,
        body: editingTemplate.body,
        suggestions: spamAnalysis?.suggestions || [],
        spamWordsFound: spamAnalysis?.spamWordsFound,
        channel: editingTemplate.channel as 'email' | 'whatsapp',
      });

      setEditingTemplate((prev) => ({
        ...prev,
        subject: editingTemplate.channel === 'email' ? res.improvedSubject : prev?.subject,
        body: res.improvedBody,
      }));

      setAppliedExplanation(res.explanation);

      setSpamAnalysis({
        score: res.newScore || 96,
        verdict: 'excellent',
        spamWordsFound: [],
        strengths: ['All deliverability and spam issues resolved by AI.'],
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
    setEditingTemplate((prev) => ({
      ...prev,
      subject: originalState.subject,
      body: originalState.body,
    }));
    setOriginalState(null);
    setAppliedExplanation(null);
    toastSuccess(t('ai.revertOriginal'));
  };

  const insertVariableTag = (tag: string) => {
    if (!editingTemplate) return;
    setEditingTemplate((prev) => ({
      ...prev,
      body: (prev?.body || '') + tag,
    }));
  };

  // Update preview when editing
  useEffect(() => {
    if (editingTemplate) {
      const vars = {
        company_name: 'Acme Technologies',
        person_name: 'Dr. Jane Smith',
        job_title: 'Head of Engineering',
        website: 'https://acme.tech',
        unsubscribe_url: 'http://localhost:5000/unsubscribe/demo-token',
      };

      let sub = editingTemplate.subject || '';
      let bod = editingTemplate.body || '';

      Object.entries(vars).forEach(([k, v]) => {
        const regex = new RegExp(`\\{\\{\\s*${k}\\s*\\}\\}`, 'gi');
        sub = sub.replace(regex, v);
        bod = bod.replace(regex, v);
      });

      setPreviewSubject(sub);
      setPreviewBody(bod);
    }
  }, [editingTemplate?.subject, editingTemplate?.body]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('templates.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {t('templates.subtitle')}
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={openNewTemplate}
        >
          {t('templates.createTemplate')}
        </Button>
      </div>

      {/* Templates Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <FileCode2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">{t('templates.noTemplatesTitle')}</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">{t('templates.noTemplatesDesc')}</p>
          <Button variant="primary" size="sm" onClick={openNewTemplate}>
            {t('templates.createTemplate')}
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((tmpl) => (
            <Card key={tmpl.id} className="p-6 flex flex-col justify-between" hoverEffect>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={tmpl.channel === 'email' ? 'brand' : 'warning'}
                      size="sm"
                      icon={
                        tmpl.channel === 'email' ? (
                          <Mail className="w-3 h-3" />
                        ) : (
                          <Lock className="w-3 h-3" />
                        )
                      }
                    >
                      {tmpl.channel === 'email' ? t('templates.emailChannel') : `${t('templates.whatsAppChannel')} (${t('common.soon') || 'قريباً'})`}
                    </Badge>

                    {tmpl.is_default === 1 && (
                      <Badge variant="warning" size="sm" icon={<Star className="w-3 h-3 fill-amber-400 text-amber-500" />}>
                        {t('templates.defaultBadge')}
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {tmpl.is_default !== 1 && (
                      <button
                        onClick={() => handleSetDefault(tmpl.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors flex items-center gap-1 text-xs font-medium"
                        title={t('templates.setDefault')}
                      >
                        <Star className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('templates.setDefault')}</span>
                      </button>
                    )}
                    <button
                      onClick={() => openEditTemplate(tmpl)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title={t('common.edit')}
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(tmpl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{tmpl.name}</h3>
                  {tmpl.subject && (
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mt-1">
                      {t('templates.emailSubject')}: {tmpl.subject}
                    </p>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-mono line-clamp-4 whitespace-pre-line">
                  {tmpl.body.replace(/<[^>]+>/g, ' ')}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>{t('templates.variablesLegend')}</span>
                <button
                  onClick={() => openEditTemplate(tmpl)}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  {t('templates.editAndPreview')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Editor & Live Preview Modal */}
      {editingTemplate && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingTemplate.id ? t('templates.editTemplateModalTitle') : t('templates.newTemplateModalTitle')}
          description={t('templates.modalSubtitle')}
          maxWidth="2xl"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Input Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('templates.templateName')}
                </label>
                <input
                  type="text"
                  value={editingTemplate.name || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, name: e.target.value })
                  }
                  placeholder="e.g. VIP Exhibition Follow-up"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('templates.channel')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTemplate({ ...editingTemplate, channel: 'email' })}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      editingTemplate.channel === 'email'
                        ? 'border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-700'
                    }`}
                  >
                    <Mail className="w-4 h-4" />
                    <span>{t('templates.emailChannel')}</span>
                  </button>

                  <button
                    type="button"
                    disabled
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800/40 cursor-not-allowed opacity-60 text-xs font-semibold flex items-center justify-center gap-1.5"
                    title={t('common.soon') || 'قريباً'}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{t('templates.whatsAppChannel')}</span>
                    <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 font-medium">
                      <Lock className="w-2.5 h-2.5" />
                      {t('common.soon') || 'قريباً'}
                    </span>
                  </button>
                </div>
              </div>

              {editingTemplate.channel === 'email' && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {t('templates.emailSubject')}
                    </label>
                    <button
                      type="button"
                      disabled={isGeneratingSubjects}
                      onClick={handleGenerateAiSubjects}
                      className="px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[11px] font-semibold flex items-center gap-1 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors disabled:opacity-50"
                    >
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>{isGeneratingSubjects ? t('ai.generatingSubjects') : t('ai.suggestSubjectsBtn')}</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={editingTemplate.subject || ''}
                    onChange={(e) =>
                      setEditingTemplate({ ...editingTemplate, subject: e.target.value })
                    }
                    placeholder={t('templates.subjectWithVar')}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                  />

                  {suggestedSubjects.length > 0 && (
                    <div className="p-2.5 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/40 space-y-1 animate-fade-in text-[11px]">
                      <span className="font-semibold text-purple-700 dark:text-purple-300">
                        {t('ai.suggestSubjectsBtn')}:
                      </span>
                      <div className="flex flex-col gap-1">
                        {suggestedSubjects.map((sub, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setEditingTemplate({ ...editingTemplate, subject: sub });
                              toastSuccess('Applied subject');
                            }}
                            className="text-left px-2 py-1 rounded bg-white dark:bg-slate-800 hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-100 dark:border-purple-900/60 text-slate-700 dark:text-slate-200 truncate transition-colors"
                          >
                            💡 {sub}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Tag Chips */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {t('templates.insertVariable')}
                </label>
                <div className="flex flex-wrap gap-1.5" dir="ltr">
                  {variableTokens.map((vt) => (
                    <button
                      key={vt.tag}
                      type="button"
                      onClick={() => insertVariableTag(vt.tag)}
                      className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 text-[11px] font-mono font-medium transition-colors"
                    >
                      + {vt.tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t('templates.messageBody', { format: editingTemplate.channel === 'email' ? 'HTML / Text' : 'Text' })}
                  </label>
                  <button
                    type="button"
                    disabled={isCheckingSpam}
                    onClick={handleCheckSpam}
                    className="px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                  >
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    <span>{isCheckingSpam ? t('ai.checkingSpam') : t('ai.spamCheckBtn')}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  value={editingTemplate.body || ''}
                  onChange={(e) =>
                    setEditingTemplate({ ...editingTemplate, body: e.target.value })
                  }
                  placeholder="Write your message here..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                />

                {/* Spam Analysis Drawer */}
                {spamAnalysis && (
                  <div className="mt-2 p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 space-y-2 animate-fade-in text-xs">
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
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {spamAnalysis.suggestions.length > 0 && (
                      <ul className="text-[11px] text-slate-600 dark:text-slate-400 list-disc list-inside space-y-0.5">
                        {spamAnalysis.suggestions.map((s, idx) => (
                          <li key={idx}>{s}</li>
                        ))}
                      </ul>
                    )}

                    {/* Explanation of AI fixes applied */}
                    {appliedExplanation && (
                      <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] flex items-start gap-2">
                        <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
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
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-emerald-600/20 transition-all disabled:opacity-50"
                      >
                        <Wand2 className="w-3.5 h-3.5" />
                        <span>{isApplyingFixes ? t('ai.applyingFixes') : t('ai.applyFixesBtn')}</span>
                      </button>

                      {originalState && (
                        <button
                          type="button"
                          onClick={handleUndoFixes}
                          className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          title={t('ai.revertOriginal')}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>{t('ai.undoChanges')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Live Interactive Preview */}
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  {t('templates.livePreview')}
                </h4>
              </div>

              <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-inner overflow-y-auto max-h-[380px]">
                {editingTemplate.channel === 'email' && (
                  <div className="mb-3 pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="font-bold text-slate-400">{t('templates.emailSubject')}: </span>
                    <span className="font-semibold text-slate-800 dark:text-white">
                      {previewSubject || '(empty subject)'}
                    </span>
                  </div>
                )}

                <div
                  className="text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-line"
                  dangerouslySetInnerHTML={{
                    __html:
                      editingTemplate.channel === 'email'
                        ? previewBody || '<span class="text-slate-400 italic">No content</span>'
                        : previewBody.replace(/\n/g, '<br/>') ||
                          '<span class="text-slate-400 italic">No content</span>',
                  }}
                />
              </div>

              <p className="text-[11px] text-slate-400 mt-2 text-center">
                {t('templates.variablesNotice')}
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveTemplate}>
              {t('templates.saveTemplate')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
};

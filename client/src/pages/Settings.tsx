import React, { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  Mail,
  MessageSquare,
  Shield,
  Save,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Info,
  Eye,
  EyeOff,
  Key,
  Lock,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { AppSettings } from '../types';

export const Settings: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [settings, setSettings] = useState<AppSettings>({
    smtp_host: 'smtp.gmail.com',
    smtp_port: 465,
    smtp_secure: true,
    smtp_user: '',
    smtp_has_pass: false,
    smtp_from_name: 'Outreach Team',
    smtp_from_email: '',
    email_daily_cap: 100,
    email_min_interval: 20,
    email_max_interval: 35,
    whatsapp_provider: 'click-to-chat',
    whatsapp_daily_cap: 30,
    whatsapp_warmup: true,
    gemini_api_key: '',
    gemini_model: 'gemini-3.5-flash-lite',
  });

  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isTestingAi, setIsTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<{ success: boolean; model?: string; responseTimeMs?: number; message?: string } | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      setSettings(res.settings);
    } catch (err: any) {
      toastError(err.message || 'Failed to load settings');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSmtpTestResult(null);

    try {
      const payload: any = { ...settings };
      // Only include password if user explicitly wanted to change it
      if (isEditingPassword && newPassword.trim()) {
        const clean = newPassword.replace(/\s+/g, '');
        if (clean === 'adminStrongPass2026!') {
          toastError(dir === 'rtl' ? 'تنبيه: لقد أدخلت كلمة مرور لوحة التحكم بدلاً من App Password' : 'Error: You entered the admin password instead of the Gmail App Password');
          setIsSaving(false);
          return;
        }
        payload.smtp_pass = clean;
      }
      await api.updateSettings(payload);
      toastSuccess(dir === 'rtl' ? 'تم حفظ الإعدادات بنجاح!' : 'Settings saved successfully!');
      setNewPassword('');
      setIsEditingPassword(false);
      loadSettings();
    } catch (err: any) {
      toastError(err.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSmtpConnection = async () => {
    setIsTestingSmtp(true);
    setSmtpTestResult(null);

    try {
      // If editing and has password, test new one; otherwise test saved password from server
      let passToTest: string | undefined = undefined;
      if (isEditingPassword && newPassword.trim()) {
        const clean = newPassword.replace(/\s+/g, '');
        if (clean !== 'adminStrongPass2026!') {
          passToTest = clean;
        }
      }

      const payload: any = {
        host: settings.smtp_host,
        port: settings.smtp_port,
        secure: settings.smtp_secure,
        user: settings.smtp_user,
        pass: passToTest,
      };
      const res = await api.testSmtp(payload);
      setSmtpTestResult({ success: true, message: res.message });
      toastSuccess(res.message);
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: err.message || 'SMTP connection failed' });
      toastError(err.message || 'SMTP connection failed');
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setAiTestResult(null);

    try {
      if (settings.gemini_api_key) {
        await api.updateSettings({
          gemini_api_key: settings.gemini_api_key,
          gemini_model: settings.gemini_model,
        });
      }
      const res = await api.testAiConnection();
      setAiTestResult(res);
      if (res.success) {
        toastSuccess(`${res.message} (${res.responseTimeMs}ms)`);
      } else {
        toastError(res.message || 'AI Test failed');
      }
    } catch (err: any) {
      setAiTestResult({ success: false, message: err.message || 'AI connection failed' });
      toastError(err.message || 'AI connection failed');
    } finally {
      setIsTestingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in pb-12">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('settings.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <form onSubmit={handleSave} autoComplete="off" className="space-y-6">
        {/* Email / SMTP Configuration Card */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center shrink-0">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('settings.emailDeliveryCardTitle')}
                </h3>
                <p className="text-xs text-slate-400">
                  {t('settings.emailDeliveryCardSubtitle')}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isTestingSmtp}
              onClick={handleTestSmtpConnection}
            >
              {t('settings.testConnection')}
            </Button>
          </div>

          {/* Test Status Banner if present */}
          {smtpTestResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                smtpTestResult.success
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {smtpTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{smtpTestResult.message}</span>
            </div>
          )}

          {/* Gmail App Password Step-by-Step Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <Info className="w-4 h-4 text-brand-600 shrink-0" />
              <span>{t('settings.howToGenerateTitle')}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-500 pl-1">
              <li>{t('settings.step1')}</li>
              <li>
                <span>{t('settings.step2')} (</span>
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-brand-600 underline font-semibold inline-flex items-center gap-0.5"
                  dir="ltr"
                >
                  myaccount.google.com/apppasswords <ExternalLink className="w-3 h-3" />
                </a>
                <span>)</span>
              </li>
              <li>{t('settings.step3')}</li>
            </ol>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.smtpHost')}
              </label>
              <input
                type="text"
                value={settings.smtp_host}
                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.smtpPortProtocol')}
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={settings.smtp_port}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_port: parseInt(e.target.value, 10) })
                  }
                  className="w-24 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  dir="ltr"
                />
                <select
                  value={settings.smtp_secure ? 'true' : 'false'}
                  onChange={(e) =>
                    setSettings({ ...settings, smtp_secure: e.target.value === 'true' })
                  }
                  className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                >
                  <option value="true">SSL (Port 465)</option>
                  <option value="false">TLS / STARTTLS (Port 587)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.smtpUser')}
              </label>
              <input
                type="text"
                value={settings.smtp_user}
                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                placeholder="youremail@gmail.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t('settings.smtpPass')}
                </label>
                {settings.smtp_has_pass && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(!isEditingPassword);
                      setNewPassword('');
                    }}
                    className="text-[11px] font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    {isEditingPassword 
                      ? (dir === 'rtl' ? 'إلغاء التغيير' : 'Cancel') 
                      : (dir === 'rtl' ? '✏️ تغيير كلمة المرور' : '✏️ Change Password')}
                  </button>
                )}
              </div>

              {settings.smtp_has_pass && !isEditingPassword ? (
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-mono">
                    <Key className="w-3.5 h-3.5 text-emerald-600" />
                    <span>•••• •••• •••• ••••</span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded text-emerald-700 dark:text-emerald-300 font-sans">
                      {dir === 'rtl' ? 'محفوظة في السيرفر' : 'Saved'}
                    </span>
                  </div>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    {dir === 'rtl' ? 'جاهزة للإرسال' : 'Active'}
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="reachcraft_app_password_unique"
                      autoComplete="new-password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                      dir="ltr"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    {dir === 'rtl' 
                      ? 'أدخل كلمة مرور التطبيق (16 حرفاً) من Google App Passwords بدون كلمة سر حسابك العادية.'
                      : 'Enter 16-character Google App Password (not your normal Google account password).'}
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.senderName')}
              </label>
              <input
                type="text"
                value={settings.smtp_from_name}
                onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                placeholder="Outreach Partnerships"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.senderEmail')}
              </label>
              <input
                type="email"
                value={settings.smtp_from_email}
                onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                placeholder="youremail@gmail.com"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>
          </div>
        </Card>

        {/* WhatsApp Provider Card (Disabled / Coming Soon) */}
        <Card className="p-6 space-y-6 relative overflow-hidden border-amber-200/60 dark:border-amber-800/40">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-850 text-slate-500 flex items-center justify-center shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('settings.whatsAppCardTitle')}
                  </h3>
                  <Badge variant="warning" size="sm" icon={<Lock className="w-3 h-3" />}>
                    {t('common.soon') || 'قريباً'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400">
                  {t('settings.whatsAppCardSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Coming Soon Notice */}
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <p className="font-bold">
                {dir === 'rtl' ? 'قناة الواتساب معطلة حالياً (قادمة قريباً)' : 'WhatsApp Channel is currently disabled (Coming Soon)'}
              </p>
              <p className="text-amber-700 dark:text-amber-400 mt-0.5">
                {dir === 'rtl'
                  ? 'يتم العمل حالياً على تجهيز الربط السحابي الرسمي (Meta Cloud API / Baileys QR). الإعدادات أدناه معطلة مؤقتاً حتى اكتمال الربط.'
                  : 'We are currently preparing official cloud connectivity (Meta Cloud API / Baileys QR). Settings below are temporarily locked until integration is complete.'}
              </p>
            </div>
          </div>

          <div className="space-y-4 opacity-50 pointer-events-none select-none">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                {t('settings.whatsAppModeLabel')}
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {t('settings.clickToChatTitle')}
                    </span>
                    <Badge variant="slate" size="sm">
                      {t('settings.clickToChatBadge')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t('settings.clickToChatDesc')}
                  </p>
                </div>

                <div
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">
                      {t('settings.sessionTitle')}
                    </span>
                    <Badge variant="slate" size="sm">
                      {t('settings.sessionBadge')}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500">
                    {t('settings.sessionDesc')}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {t('settings.whatsAppDailyCap')}
                </label>
                <input
                  type="number"
                  disabled
                  value={settings.whatsapp_daily_cap}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center pt-5">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    disabled
                    checked={settings.whatsapp_warmup}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span>{t('settings.warmupModeLabel')}</span>
                </label>
              </div>
            </div>
          </div>
        </Card>

        {/* Google Gemini AI Configuration Card */}
        <Card className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {t('ai.geminiCardTitle')}
                  </h3>
                  <Badge variant="brand" size="sm">
                    {t('ai.badge')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('ai.geminiCardSubtitle')}
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isTestingAi}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-purple-500" />}
              onClick={handleTestAiConnection}
            >
              {t('ai.testAiBtn')}
            </Button>
          </div>

          {/* AI Connection Test Result Banner */}
          {aiTestResult && (
            <div
              className={`p-4 rounded-xl flex items-start gap-3 border text-xs ${
                aiTestResult.success
                  ? 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300'
                  : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
              }`}
            >
              {aiTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-purple-600 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              )}
              <div>
                <p className="font-semibold">
                  {aiTestResult.success
                    ? t('ai.aiConnected').replace('{time}', String(aiTestResult.responseTimeMs || 0))
                    : t('ai.aiFailed')}
                </p>
                {aiTestResult.message && <p className="mt-0.5 text-[11px] opacity-90">{aiTestResult.message}</p>}
                {aiTestResult.model && (
                  <p className="mt-1 text-[11px] font-mono opacity-80">
                    Model: {aiTestResult.model}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('ai.apiKeyLabel')}
              </label>
              <input
                type="password"
                value={settings.gemini_api_key || ''}
                onChange={(e) => setSettings({ ...settings, gemini_api_key: e.target.value })}
                placeholder="AQ.Ab8RN... or AIzaSy..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Google AI Studio API Key (Free & Pro tiers supported)
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('ai.modelLabel')}
              </label>
              <select
                value={settings.gemini_model || 'gemini-3.5-flash-lite'}
                onChange={(e) => setSettings({ ...settings, gemini_model: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-medium"
                dir="ltr"
              >
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Fast ~900ms - Recommended)</option>
                <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast & Reliable)</option>
                <option value="gemini-3-flash-preview">gemini-3-flash-preview (High Reasoning)</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Automatically falls back to alternative models if temporary demand spikes occur.
              </p>
            </div>
          </div>
        </Card>

        {/* Daily Caps & Pacing Card */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="w-5 h-5 text-brand-600 shrink-0" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {t('settings.pacingCardTitle')}
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.emailDailyCap')}
              </label>
              <input
                type="number"
                value={settings.email_daily_cap}
                onChange={(e) =>
                  setSettings({ ...settings, email_daily_cap: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.minJitter')}
              </label>
              <input
                type="number"
                value={settings.email_min_interval}
                onChange={(e) =>
                  setSettings({ ...settings, email_min_interval: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('settings.maxJitter')}
              </label>
              <input
                type="number"
                value={settings.email_max_interval}
                onChange={(e) =>
                  setSettings({ ...settings, email_max_interval: parseInt(e.target.value, 10) })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono"
                dir="ltr"
              />
            </div>
          </div>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            variant="primary"
            isLoading={isSaving}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t('settings.saveAllSettings')}
          </Button>
        </div>
      </form>
    </div>
  );
};

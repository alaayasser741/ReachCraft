import React, { useState } from 'react';
import {
  Sparkles,
  Mail,
  Key,
  Lock,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Check,
  Info,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { useToast } from '../ui/Toast';

interface Props {
  isOpen: boolean;
  onClose?: () => void;
}

export const OnboardingWizardModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { dir } = useTranslation();
  const { user, setUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [geminiKey, setGeminiKey] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTested, setGeminiTested] = useState(false);

  const [smtpEmail, setSmtpEmail] = useState(user?.email || '');
  const [smtpName, setSmtpName] = useState(user?.name || '');
  const [smtpPass, setSmtpPass] = useState('');

  if (!isOpen) return null;

  const isAr = dir === 'rtl';

  const testGeminiKey = async () => {
    if (!geminiKey.trim()) {
      toastError(isAr ? 'يرجى إدخال مفتاح Gemini أولاً' : 'Please enter a Gemini key first');
      return;
    }
    setIsTestingGemini(true);
    try {
      // Test key via Gemini API ping endpoint
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey.trim()}`
      );
      if (res.ok) {
        setGeminiTested(true);
        toastSuccess(isAr ? 'تم التحقق من مفتاح Gemini بنجاح! ⚡' : 'Gemini key verified successfully!');
      } else {
        toastError(isAr ? 'المفتاح غير صالح أو لم يتم تفعيله بعد' : 'Key is invalid or not yet active');
      }
    } catch {
      toastError(isAr ? 'تعذر الاتصال بـ Google AI Studio' : 'Failed to reach Google AI Studio');
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    try {
      const cleanPass = smtpPass.replace(/\s+/g, '');
      const res = await api.completeOnboarding({
        gemini_api_key: geminiKey.trim() || undefined,
        smtp_user: smtpEmail.trim() || undefined,
        smtp_pass: cleanPass || undefined,
        smtp_from_name: smtpName.trim() || undefined,
        smtp_from_email: smtpEmail.trim() || undefined,
      });

      if (res.user) {
        setUser(res.user);
      }

      toastSuccess(isAr ? 'تم تشفير وحفظ بياناتك بنجاح! مرحباً بك في ReachCraft 🚀' : 'Setup completed successfully! Welcome to ReachCraft');
      if (onClose) onClose();
    } catch (err: any) {
      toastError(err.message || 'Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      dir={dir}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[92vh] flex flex-col">
        {/* Stepper Progress */}
        <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20">
              {step}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {step === 1 && (isAr ? 'الخطوة 1: ربط الذكاء الاصطناعي (Gemini)' : 'Step 1: Connect AI Brain (Gemini)')}
                {step === 2 && (isAr ? 'الخطوة 2: ربط بريدك للإرسال الآمن (Gmail)' : 'Step 2: Connect Outreach Email (Gmail)')}
                {step === 3 && (isAr ? 'الخطوة 3: التشفير وجاهزية الإطلاق' : 'Step 3: Encryption & Final Launch')}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'إعداد سريع لمرة واحدة فقط يستغرق دقيقة واحدة' : 'One-time quick setup, takes less than a minute'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isAr ? 'تشفير AES-256' : 'AES-256 Encrypted'}</span>
          </div>
        </div>

        {/* Step Body */}
        <div className="overflow-y-auto py-6 space-y-6 flex-1 pe-1">
          {/* STEP 1: Gemini AI Key */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/50 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  <strong className="block text-sm text-slate-900 dark:text-white mb-1">
                    {isAr ? 'استخراج ذكي بدون أي تكلفة عليك' : 'Zero-cost Intelligent Extraction'}
                  </strong>
                  {isAr
                    ? 'يمنحك Google AI Studio حصة مجانية ضخمة مدى الحياة. لن تدفع أي شيء، والمفتاح خاص بك تماماً لاستخراج الشركات وصياغة رسائل البريد.'
                    : 'Google AI Studio offers a generous free tier forever. Your key is dedicated solely to your workspace.'}
                </div>
              </div>

              {/* Instructions */}
              <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Info className="w-4 h-4 text-emerald-600" />
                  <span>{isAr ? 'كيف تحصل على المفتاح المجاني في 30 ثانية؟' : 'How to get your free key in 30 seconds:'}</span>
                </p>
                <ol className="list-decimal list-inside space-y-1.5 ps-1">
                  <li>
                    {isAr ? 'اضغط على الرابط بالأسفل لفتح ' : 'Open '}
                    <strong className="text-slate-900 dark:text-white">Google AI Studio</strong>.
                  </li>
                  <li>
                    {isAr
                      ? 'سجّل بحساب جوجل واضغط زر '
                      : 'Sign in with Google and click '}
                    <strong className="text-emerald-700 dark:text-emerald-400">"Create API key"</strong>.
                  </li>
                  <li>
                    {isAr ? 'انسخ المفتاح (يبدأ بـ AIzaSy...) والصقه هنا بالأسفل.' : 'Copy the key (starts with AIzaSy...) and paste it below.'}
                  </li>
                </ol>

                <div className="pt-2">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                  >
                    <span>{isAr ? 'فتح صفحة Google AI Studio ↗' : 'Open Google AI Studio ↗'}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Input Field */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  {isAr ? 'مفتاح Google Gemini API' : 'Google Gemini API Key'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={geminiKey}
                      onChange={(e) => {
                        setGeminiKey(e.target.value);
                        setGeminiTested(false);
                      }}
                      placeholder="AIzaSy..."
                      dir="ltr"
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={testGeminiKey}
                    disabled={isTestingGemini || !geminiKey}
                    className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
                  >
                    {isTestingGemini ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : geminiTested ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{geminiTested ? (isAr ? 'تم التحقق' : 'Verified') : (isAr ? 'فحص المفتاح' : 'Test Key')}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Gmail SMTP */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* CRITICAL 2-STEP VERIFICATION WARNING */}
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700/60 flex items-start gap-3.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <strong className="block text-sm font-bold text-amber-950 dark:text-amber-100 mb-1">
                    {isAr ? '⚠️ تنبيه إلزامي قبل إنشاء كلمة المرور:' : '⚠️ Important Requirement:'}
                  </strong>
                  {isAr ? (
                    <>
                      لكي يظهر لك خيار <strong className="underline">كلمات مرور التطبيقات (App Passwords)</strong> في حساب جوجل،{' '}
                      <strong>يجب أن تكون ميزة "التحقق بخطوتين (2-Step Verification)" مفعلة مسبقاً في حسابك!</strong>
                    </>
                  ) : (
                    <>
                      Google requires <strong>2-Step Verification</strong> to be turned ON on your Google Account before allowing you to generate an App Password.
                    </>
                  )}
                  <div className="mt-2.5 flex flex-wrap items-center gap-3">
                    <a
                      href="https://myaccount.google.com/signinoptions/two-step-verification"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-amber-800 dark:text-amber-300 underline hover:text-amber-950"
                    >
                      <span>{isAr ? '1. فحص وتفعيل التحقق بخطوتين ↗' : '1. Turn On 2-Step Verification ↗'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                    <a
                      href="https://myaccount.google.com/apppasswords"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400 underline hover:text-emerald-900"
                    >
                      <span>{isAr ? '2. الذهاب لصفحة كلمات مرور التطبيقات ↗' : '2. Open App Passwords Page ↗'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Visual steps */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white">
                  {isAr ? 'خطوات إنشاء كلمة المرور المكونة من 16 رمزاً:' : 'How to generate your 16-character App Password:'}
                </p>
                <ol className="list-decimal list-inside space-y-1 ps-1">
                  <li>{isAr ? 'ادخل على صفحة App Passwords في حساب جوجل.' : 'Open Google App Passwords page.'}</li>
                  <li>{isAr ? 'اكتب اسم التطبيق: ReachCraft ثم اضغط إنشـاء (Create).' : 'Name the app "ReachCraft" and click Create.'}</li>
                  <li>{isAr ? 'انسخ الـ 16 حرفاً المعروضة باللون الأصفر وضعها هنا.' : 'Copy the 16 characters shown and paste them below.'}</li>
                </ol>
              </div>

              {/* Form Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {isAr ? 'بريدك الإلكتروني في Gmail' : 'Your Gmail Address'}
                  </label>
                  <input
                    type="email"
                    value={smtpEmail}
                    onChange={(e) => setSmtpEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    dir="ltr"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {isAr ? 'اسمك أو اسم شركتك المرسلة' : 'Sender / Company Name'}
                  </label>
                  <input
                    type="text"
                    value={smtpName}
                    onChange={(e) => setSmtpName(e.target.value)}
                    placeholder={isAr ? 'مثال: علاء عبد الله' : 'e.g. Alaa Abdullah'}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    {isAr ? 'كلمة مرور التطبيق (16 حرفاً)' : 'App Password (16 characters)'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute start-3 top-3 text-slate-400" />
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      dir="ltr"
                      className="w-full ps-9 pe-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {isAr
                      ? 'ملاحظة: هذه ليست كلمة مرور حسابك الشخصية، بل رمز ترخيص مخصص للأمان فقط.'
                      : 'Note: This is not your account password, but a revocable app-specific passcode.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Summary & Encryption Guarantee */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200 text-center py-4">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border-2 border-emerald-300 dark:border-emerald-700/60">
                <ShieldCheck className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  {isAr ? 'كل شيء جاهز ومحمي بالكامل 🔒' : 'Ready & Fully Encrypted 🔒'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                  {isAr
                    ? 'سيتم تشفير مفاتيحك وكلمة مرورك فورياً بتقنية AES-256-GCM قبل حفظها في مساحة حسابك المعزولة. لن يطلب منك النظام إدخالها مجدداً، وستتمكن من تشغيل الحملات بأمان تام.'
                    : 'Your keys and App Password will be immediately encrypted using AES-256-GCM prior to storage in your tenant workspace. You are ready to launch outreach campaigns seamlessly.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-start text-xs pt-2">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[11px]">{isAr ? 'عقل الذكاء الاصطناعي:' : 'AI Key:'}</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {geminiKey ? (isAr ? 'تم الإدخال' : 'Entered') : (isAr ? 'اختياري لاحقاً' : 'Optional')}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 block text-[11px]">{isAr ? 'بريد الإرسال:' : 'Email Sender:'}</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {smtpPass ? (isAr ? 'تم الإدخال' : 'Entered') : (isAr ? 'اختياري لاحقاً' : 'Optional')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="pt-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as any)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex items-center gap-1.5"
            >
              {isAr ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
              <span>{isAr ? 'السابق' : 'Back'}</span>
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as any)}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
            >
              <span>{isAr ? 'التالي' : 'Next'}</span>
              {isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleFinish}
              className="px-7 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{isAr ? 'حفظ وتفعيل الحساب 🚀' : 'Save & Launch Workspace 🚀'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

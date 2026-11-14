import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mail,
  Lock,
  User as UserIcon,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  RotateCw,
  Sun,
  Moon,
  Globe,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { Button } from '../components/ui/Button';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { TermsPrivacyModal } from '../components/compliance/TermsPrivacyModal';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, setUser } = useAuth();
  const { t, language, toggleLanguage, dir } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { success: toastSuccess, error: toastError } = useToast();

  const [step, setStep] = useState<1 | 2>(1); // 1 = info, 2 = OTP
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [otpCode, setOtpCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAr = dir === 'rtl';

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptTerms) {
      setError(isAr ? 'يجب الموافقة على شروط الاستخدام وسياسة الخصوصية للمتابعة' : 'You must accept the terms and privacy policy to continue');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.requestRegisterOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        acceptTerms,
        language: language as 'ar' | 'en',
      });

      toastSuccess(isAr ? 'تم إرسال رمز التحقق (OTP) إلى بريدك الإلكتروني بنجاح ✉️' : 'Verification code sent to your email ✉️');
      setStep(2);
      setResendCooldown(60);

      // If in dev mode and code returned, prefill or alert
      if (res.devCode) {
        toastSuccess(`(رمز التحقق التجريبي: ${res.devCode})`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP & Create Account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      setError(isAr ? 'الرجاء إدخال رمز التحقق المكون من 6 أرقام' : 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await api.verifyRegisterOtp({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        code: otpCode.trim(),
      });

      if (res.user) {
        setUser(res.user);
      }

      toastSuccess(isAr ? 'تم إنشاء وتفعيل حسابك بنجاح! مرحباً بك' : 'Account created and verified successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSuccess = async (credential: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credential);
      toastSuccess(isAr ? 'تم تسجيل الدخول بحساب Google بنجاح 🚀' : 'Logged in with Google successfully 🚀');
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4 sm:p-6 relative"
      dir={dir}
    >
      {/* Top Controls: Theme & Language */}
      <div className={`absolute top-6 ${dir === 'rtl' ? 'left-6' : 'right-6'} flex items-center gap-2`}>
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
          title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 transition-transform hover:rotate-45" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
          )}
        </button>

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
        >
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-block">
            <div className="inline-flex w-16 h-16 rounded-3xl bg-white dark:bg-slate-900 p-2 items-center justify-center border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-emerald-500/10 mb-3 hover:scale-105 transition-transform">
              <img src="/logo.png" alt="ReachCraft" className="w-full h-full object-contain" />
            </div>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'إنشاء حساب مجاني جديد' : 'Create Free Account'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            {isAr
              ? 'انضم للنسخة التجريبية المجانية واستخرج جهات الاتصال بذكاء'
              : 'Join the free beta and extract exhibition leads with AI'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl shadow-slate-200/40 dark:shadow-none p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <>
              {/* Google Fast Sign-In */}
              <div className="mb-4">
                <GoogleSignInButton
                  onSuccess={handleGoogleSuccess}
                  onError={(err) => setError(err.message || 'Google Sign-in failed')}
                />
              </div>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">
                    {isAr ? 'أو عبر البريد الإلكتروني' : 'Or register with email'}
                  </span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {isAr ? 'الاسم الكامل أو اسم الشركة' : 'Full Name or Company'}
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={isAr ? 'مثال: علاء عبد الله' : 'e.g. Alaa Abdullah'}
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      dir="ltr"
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Terms and Privacy Checkbox */}
                <div className="pt-2">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 dark:text-slate-400 leading-relaxed select-none">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-0.5 cursor-pointer shrink-0"
                    />
                    <span>
                      {isAr ? (
                        <>
                          أوافق على{' '}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.preventDefault();
                              setShowTermsModal(true);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            شروط الخدمة وسياسة الخصوصية
                          </button>{' '}
                          وتخزين بيانات الاعتماد مشفرة بتقنية AES-256.
                        </>
                      ) : (
                        <>
                          I agree to the{' '}
                          <button
                            type="button"
                            onClick={(ev) => {
                              ev.preventDefault();
                              setShowTermsModal(true);
                            }}
                            className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                          >
                            Terms of Service & Privacy Policy
                          </button>{' '}
                          and AES-256 encrypted credential storage.
                        </>
                      )}
                    </span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  size="lg"
                  isLoading={isLoading}
                  rightIcon={isAr ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                >
                  {isAr ? 'إرسال رمز التحقق ✉️' : 'Send Verification Code ✉️'}
                </Button>
              </form>
            </>
          ) : (
            /* STEP 2: OTP Entry */
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-in fade-in duration-200">
              <div className="text-center p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {isAr ? 'تم إرسال كود من 6 أرقام إلى بريدك:' : 'We sent a 6-digit code to:'}
                </p>
                <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  {email}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                  {isAr ? 'رمز التحقق (OTP)' : 'Enter 6-Digit Code'}
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    dir="ltr"
                    autoFocus
                    className="w-full ps-11 pe-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-center text-xl font-bold tracking-[6px] font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline"
                >
                  {isAr ? 'تعديل البريد' : 'Change email'}
                </button>

                <button
                  type="button"
                  disabled={resendCooldown > 0 || isLoading}
                  onClick={handleRequestOtp}
                  className="text-emerald-600 dark:text-emerald-400 font-semibold disabled:opacity-50 hover:underline flex items-center gap-1"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>
                    {resendCooldown > 0
                      ? isAr
                        ? `إعادة الإرسال بعد (${resendCooldown} ث)`
                        : `Resend in (${resendCooldown}s)`
                      : isAr
                      ? 'إعادة إرسال الرمز'
                      : 'Resend Code'}
                  </span>
                </button>
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                size="lg"
                isLoading={isLoading}
                rightIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {isAr ? 'تأكيد ودخول المنصة 🚀' : 'Verify & Launch Workspace 🚀'}
              </Button>
            </form>
          )}

          {/* Switch to Login */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
            <span>{isAr ? 'لديك حساب بالفعل؟' : 'Already have an account?'} </span>
            <Link
              to="/login"
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {isAr ? 'تسجيل الدخول' : 'Sign in here'}
            </Link>
          </div>
        </div>

        {/* Security badge footer */}
        <p className="text-center text-xs text-slate-400 mt-6 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isAr ? 'تشفير عسكري AES-256 لحماية مفاتيحك وبياناتك' : 'AES-256 encryption protecting your data'}</span>
        </p>
      </div>

      {/* Terms & Privacy Modal */}
      <TermsPrivacyModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} />
    </div>
  );
};

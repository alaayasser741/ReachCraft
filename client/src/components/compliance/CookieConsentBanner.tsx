import React, { useState, useEffect } from 'react';
import { Shield, Cookie, X, Check, Sliders } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export interface CookiePreferences {
  essential: boolean;
  preferences: boolean;
  analytics: boolean;
  consentDate: string;
}

const STORAGE_KEY = 'reachcraft_cookie_consent_v1';

export const CookieConsentBanner: React.FC = () => {
  const { dir } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true,
    preferences: true,
    analytics: false,
    consentDate: '',
  });

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      // Delay slightly for smooth entrance
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    const consent = { ...prefs, consentDate: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    setIsVisible(false);
    setShowPreferences(false);
  };

  const handleAcceptAll = () => {
    saveConsent({
      essential: true,
      preferences: true,
      analytics: true,
      consentDate: '',
    });
  };

  const handleAcceptEssential = () => {
    saveConsent({
      essential: true,
      preferences: false,
      analytics: false,
      consentDate: '',
    });
  };

  const handleSaveCustom = () => {
    saveConsent(preferences);
  };

  if (!isVisible) return null;

  const isAr = dir === 'rtl';

  return (
    <>
      {/* Floating Bottom Banner */}
      <div 
        dir={dir}
        className="fixed bottom-4 start-4 end-4 md:start-auto md:end-6 md:max-w-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300"
      >
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xl shadow-slate-900/10 dark:shadow-black/40">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-800/40">
              <Cookie className="w-5 h-5" />
            </div>

            <div className="flex-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{isAr ? 'خصوصيتك وبياناتك تحت سيطرتك' : 'Your Privacy & Cookie Choices'}</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/50">
                  <Shield className="w-3 h-3" />
                  {isAr ? 'مشفر 256-bit' : 'Encrypted'}
                </span>
              </h4>

              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                {isAr
                  ? 'نستخدم ملفات تعريف الارتباط الضرورية لحفظ جلسات الأمان واللغة. لا نقوم ببيع بياناتك، ويتم تشفير مفاتيحك الخاصة محلياً وفق معايير الأمان المتقدمة.'
                  : 'We use essential cookies to maintain secure sessions and preferences. We never sell your data, and your API credentials are encrypted with industry-standard protocols.'}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isAr ? 'قبول الكل' : 'Accept All'}
                </button>

                <button
                  onClick={handleAcceptEssential}
                  className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-medium transition-all duration-150"
                >
                  {isAr ? 'الضرورية فقط' : 'Essential Only'}
                </button>

                <button
                  onClick={() => setShowPreferences(true)}
                  className="px-3 py-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium transition-colors flex items-center gap-1 ms-auto"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  {isAr ? 'تخصيص' : 'Customize'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Modal */}
      {showPreferences && (
        <div 
          dir={dir}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Cookie className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'تفضيلات ملفات تعريف الارتباط' : 'Cookie Preferences'}
                </h3>
              </div>
              <button
                onClick={() => setShowPreferences(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 py-5">
              {/* Essential */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">
                      {isAr ? 'ملفات تعريف الارتباط الضرورية' : 'Essential Cookies'}
                    </span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded">
                      {isAr ? 'إلزامية' : 'Required'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {isAr
                      ? 'مطلوبة لتسجيل الدخول بأمان، وإدارة الجلسات، وحماية المنصة من الهجمات.'
                      : 'Required for secure login, session authentication, and CSRF protection.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={true}
                  disabled
                  className="rounded text-emerald-600 h-4 w-4 mt-1 cursor-not-allowed opacity-70"
                />
              </div>

              {/* Preferences */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isAr ? 'ملفات التفضيلات والمظهر' : 'Preferences & Theme'}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {isAr
                      ? 'تتذكر اختيارك للغة (عربي / إنجليزي) والوضع الليلي/النهاري وحجم الجداول.'
                      : 'Remembers your preferred language (AR/EN), light/dark mode, and table view states.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.preferences}
                  onChange={(e) => setPreferences({ ...preferences, preferences: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60">
                <div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">
                    {isAr ? 'تحسين الأداء وسرعة الاستجابة' : 'Performance & Reliability'}
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {isAr
                      ? 'تساعدنا في قياس سرعة تحميل الكتالوجات ومعالجة الأخطاء دون تسجيل أي محتوى خاص.'
                      : 'Helps us measure catalog parsing performance and debug errors without storing personal data.'}
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500 h-4 w-4 mt-1 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveCustom}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                {isAr ? 'حفظ تفضيلاتي' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

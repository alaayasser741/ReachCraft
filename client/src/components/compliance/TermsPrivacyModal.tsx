import React from 'react';
import { X, ShieldCheck, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsPrivacyModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { dir } = useTranslation();
  if (!isOpen) return null;

  const isAr = dir === 'rtl';

  return (
    <div 
      dir={dir}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-100 dark:border-emerald-800/40">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isAr ? 'شروط الخدمة وسياسة حماية البيانات' : 'Terms of Service & Data Protection'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr ? 'التزامنا الصريح بحماية خصوصيتك وأمان بياناتك' : 'Our commitment to your privacy and security'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-5 space-y-6 text-xs text-slate-600 dark:text-slate-300 leading-relaxed pe-2">
          {/* Section 1: AES-256 Encryption */}
          <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{isAr ? '1. التشفير الكامل لبيانات الاعتماد (AES-256-GCM)' : '1. Military-Grade AES-256-GCM Encryption'}</span>
            </div>
            <p>
              {isAr
                ? 'أي مفاتيح برمجية (Gemini API Key) أو كلمات مرور تطبيقات (Gmail App Password) تُدخلها في المنصة يتم تشفيرها فورياً باستخدام خوارزمية AES-256-GCM مع مفتاح فريد قبل تخزينها. لا يمكن لأي مطور أو مسؤول في المنصة الاطلاع على كلمات المرور المجردة أو استخراجها.'
                : 'Any API keys (Google Gemini) or App Passwords (Gmail) entered are immediately encrypted using AES-256-GCM with unique initialization vectors prior to storage. No platform administrator or third party can access or view plaintext credentials.'}
            </p>
          </div>

          {/* Section 2: Data Ownership */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mb-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? '2. ملكية البيانات والكتالوجات' : '2. Full Data Ownership'}</span>
            </h4>
            <p>
              {isAr
                ? 'كافة ملفات الـ PDF والكتالوجات وجهات الاتصال التي تستخرجها أو ترفعها هي ملكك الحصري 100%. لا نقوم بمشاركة أي جهات اتصال مع مستخدمين آخرين أو بيعها لأي جهة تجارية.'
                : 'All PDF catalogs, companies, and contacts you extract or upload remain 100% your intellectual property. We never sell, share, or pool your extracted contacts with any third party.'}
            </p>
          </div>

          {/* Section 3: Anti-Spam & Fair Usage */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? '3. سياسة الاستخدام العادل ومكافحة السبام' : '3. Fair Usage & Anti-Spam Policy'}</span>
            </h4>
            <p>
              {isAr
                ? 'تُستخدم ReachCraft للتواصل المهني الحقيقي (B2B Outreach) مع الشركاء والمعارض. يُحظر تماماً استخدام المنصة في إرسال رسائل عشوائية ضارة (Spam)، أو محاولات التصيد الاحتيالي (Phishing)، أو أي محتوى يخالف القوانين. يحتفظ مسؤولو المنصة بالحق في تجميد أي حساب ينتهك هذه المعايير لحماية سمعة الخوادم.'
                : 'ReachCraft is designed strictly for targeted professional B2B outreach. Using the platform for deceptive spam, phishing, or malicious campaigns is strictly prohibited and subject to immediate account suspension.'}
            </p>
          </div>

          {/* Section 4: Account Control */}
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-1.5 mb-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>{isAr ? '4. التحكم الكامل وحذف الحساب' : '4. User Rights & Data Deletion'}</span>
            </h4>
            <p>
              {isAr
                ? 'يحق لك في أي وقت تعديل مفاتيحك أو حذف جهات الاتصال الخاصة بك بالكامل أو طلب مسح حسابك من قاعدة البيانات نهائياً.'
                : 'You retain the right to modify your credentials, delete extracted contacts, or request full account termination and data erasure at any time.'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
          >
            {isAr ? 'فهمت وأوافق' : 'I Understand & Agree'}
          </button>
        </div>
      </div>
    </div>
  );
};

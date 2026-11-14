import React from 'react';
import {
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Send,
  Database,
  Gift,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const LandingFeatures: React.FC = () => {
  const { t, dir } = useTranslation();

  const featureCards = [
    {
      icon: UploadCloud,
      title: t('landing.features.f1Title'),
      desc: t('landing.features.f1Desc'),
      benefit: dir === 'rtl' ? 'منع التكرار بنسبة 100%' : '100% Zero Duplicates',
    },
    {
      icon: Sparkles,
      title: t('landing.features.f2Title'),
      desc: t('landing.features.f2Desc'),
      benefit: dir === 'rtl' ? 'وصول مضمون للـ Inbox' : 'Guaranteed Primary Inbox',
    },
    {
      icon: ShieldCheck,
      title: t('landing.features.f3Title'),
      desc: t('landing.features.f3Desc'),
      benefit: dir === 'rtl' ? 'معدل مخاطر حظر 0%' : '0% Ban Risk Guarantee',
    },
    {
      icon: Gift,
      title: t('landing.features.f4Title'),
      desc: t('landing.features.f4Desc'),
      benefit: dir === 'rtl' ? 'مجاني 100% للأبد' : '100% Free Forever',
    },
    {
      icon: Send,
      title: t('landing.features.f5Title'),
      desc: t('landing.features.f5Desc'),
      benefit: dir === 'rtl' ? 'ترجمة ردود فورية' : 'Real-time AI Translation',
    },
    {
      icon: Database,
      title: t('landing.features.f6Title'),
      desc: t('landing.features.f6Desc'),
      benefit: dir === 'rtl' ? 'سرعة بحث فائقة' : 'Sub-millisecond Search',
    },
  ];

  return (
    <section id="features" className="py-20 sm:py-28 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('landing.features.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('landing.features.title')}
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400">
            {t('landing.features.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {featureCards.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-7 sm:p-8 hover:border-brand-500/50 hover:shadow-xl hover:shadow-brand-500/5 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 flex items-center justify-center text-brand-600 dark:text-brand-400 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span>{feat.benefit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

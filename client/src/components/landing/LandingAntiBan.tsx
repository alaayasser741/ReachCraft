import React from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const LandingAntiBan: React.FC = () => {
  const { t, dir } = useTranslation();

  return (
    <section id="anti-ban" className="py-20 sm:py-28 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('landing.antiBan.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('landing.antiBan.title')}
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400">
            {t('landing.antiBan.subtitle')}
          </p>
        </div>

        {/* Comparison Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Traditional Blasters (High Risk) */}
          <div className="rounded-3xl border border-rose-200/90 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10 p-8 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('landing.antiBan.tradTitle')}
                </h3>
                <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 font-mono">
                  {dir === 'rtl' ? 'مخاطر حظر مرتفعة 95%' : 'High Ban Risk (95%)'}
                </span>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>{t('landing.antiBan.trad1')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>{t('landing.antiBan.trad2')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>{t('landing.antiBan.trad3')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-rose-500 font-bold shrink-0">✕</span>
                <span>{t('landing.antiBan.trad4')}</span>
              </li>
            </ul>
          </div>

          {/* ReachCraft Intelligent Engine (Safe) */}
          <div className="rounded-3xl border border-emerald-300/90 dark:border-emerald-800/90 bg-emerald-50/30 dark:bg-emerald-950/15 p-8 space-y-6 shadow-xl shadow-emerald-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {t('landing.antiBan.reachTitle')}
                </h3>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                  {dir === 'rtl' ? 'أمان تام 0% مخاطر حظر' : '100% Safe (0% Ban Risk)'}
                </span>
              </div>
            </div>

            <ul className="space-y-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('landing.antiBan.reach1')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('landing.antiBan.reach2')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('landing.antiBan.reach3')}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>{t('landing.antiBan.reach4')}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

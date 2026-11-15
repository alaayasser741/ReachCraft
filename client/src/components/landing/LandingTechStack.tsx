import React from 'react';
import { Cpu, DollarSign, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const LandingTechStack: React.FC = () => {
  const { t } = useTranslation();

  const stackItems = [
    { name: 'React 18 & Vite', category: 'Frontend Engine', desc: 'Instant HMR, concurrent mode, zero lag' },
    { name: 'Tailwind CSS & shadcn', category: 'UI & Design System', desc: 'Accessible, dark-mode native, RTL & LTR' },
    { name: 'Node.js & Express', category: 'Backend REST API', desc: 'Lightweight asynchronous event loop' },
    { name: 'SQLite with WAL Mode', category: 'Zero-Config Database', desc: '100% private, local-first ACID storage' },
    { name: 'Nodemailer & Gmail SMTP', category: 'Free Outreach Transport', desc: '500 emails/day free with human pacing' },
    { name: 'Google Gemini 1.5 Pro', category: 'AI Intelligence', desc: 'Generous free tier via Google AI Studio' },
  ];

  return (
    <section id="tech-stack" className="py-20 sm:py-28 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold">
            <Cpu className="w-3.5 h-3.5" />
            <span>{t('landing.techStack.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('landing.techStack.title')}
          </h2>

          <p className="text-base text-slate-600 dark:text-slate-400">
            {t('landing.techStack.subtitle')}
          </p>
        </div>

        {/* Stack Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto mb-12">
          {stackItems.map((tech, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 hover:border-brand-500/40 hover:shadow-lg transition-all"
            >
              <div className="text-[11px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 font-mono mb-1">
                {tech.category}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {tech.name}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tech.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Cost Comparison Callout */}
        <div className="max-w-4xl mx-auto rounded-3xl border border-emerald-300/90 dark:border-emerald-800/90 bg-emerald-50/40 dark:bg-emerald-950/20 p-5 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5 sm:gap-6 shadow-sm">
          <div className="space-y-1 text-center sm:text-start">
            <div className="flex items-center justify-center sm:justify-start gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm">
              <DollarSign className="w-4 h-4" />
              <span>Zero-Dollar Software Architecture</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl">
              Traditional SaaS outreach suites cost $99-$250/month per seat. ReachCraft delivers equal enterprise extraction, audit, and dispatch capabilities at literally $0.00/mo.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 shrink-0">
            <div className="text-center p-2.5 sm:p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-[10px] text-slate-400 block font-semibold">Other SaaS</span>
              <span className="text-base sm:text-lg font-bold text-rose-500 line-through">$180/mo</span>
            </div>
            <span className="font-bold text-slate-400">vs</span>
            <div className="text-center p-2.5 sm:p-3 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-500/25">
              <span className="text-[10px] text-emerald-100 block font-semibold">ReachCraft</span>
              <span className="text-base sm:text-lg font-black">$0 / Free</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

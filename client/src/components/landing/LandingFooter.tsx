import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/LanguageContext';

export const LandingFooter: React.FC = () => {
  const { t } = useTranslation();

  return (
    <footer className="bg-white dark:bg-[#05080f] border-t border-slate-200 dark:border-slate-800 py-12 text-slate-500 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="ReachCraft" className="w-9 h-9 object-contain shrink-0" />
          <div>
            <div className="font-bold text-slate-900 dark:text-white">ReachCraft Platform</div>
            <div className="text-[11px]">{t('landing.footer.desc')}</div>
          </div>
        </div>

        <div className="text-center sm:text-end space-y-1">
          <p>{t('landing.footer.rights')}</p>
          <p className="text-[11px] text-slate-400">
            <Link
              to="/developer"
              className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors underline decoration-slate-300 dark:decoration-slate-700 font-semibold"
            >
              {t('landing.footer.designedBy')}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
};

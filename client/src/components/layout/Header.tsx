import React, { useState } from 'react';
import { Menu, Plus, Upload, CheckCircle2, Globe, Moon, Sun, Send } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { DirectSendModal } from '../outreach/DirectSendModal';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  title?: string;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, title }) => {
  const { t, language, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [isDirectSendOpen, setIsDirectSendOpen] = useState(false);

  return (
    <>
      <header className="h-16 bg-white/80 dark:bg-[#0b0f19]/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between px-4 sm:px-8 z-30 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="w-5 h-5" />
          </button>
          {title && <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">{title}</h2>}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Modern Theme Switcher (Light / Modern Night Mode) */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs"
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 transition-transform rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 dark:text-slate-300 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Language Switcher Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all shadow-xs"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* Free Stack Active Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-medium border border-emerald-200/60 dark:border-emerald-800/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('common.freeStackActive')}</span>
          </div>

          {/* Direct Send Single Message Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDirectSendOpen(true)}
            leftIcon={<Send className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />}
            className="border-brand-300 dark:border-brand-800/80 hover:bg-brand-50/50 dark:hover:bg-brand-950/30 text-brand-700 dark:text-brand-300"
          >
            <span className="hidden sm:inline">{t('header.directSend')}</span>
            <span className="sm:hidden">{t('header.directSend')}</span>
          </Button>

          <Link to="/upload" className="hidden sm:block">
            <Button variant="outline" size="sm" leftIcon={<Upload className="w-4 h-4" />}>
              {t('header.uploadButton')}
            </Button>
          </Link>

          <Link to="/campaigns?action=new">
            <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
              {t('header.newCampaign')}
            </Button>
          </Link>
        </div>
      </header>

      {/* Direct Outreach Modal */}
      <DirectSendModal
        isOpen={isDirectSendOpen}
        onClose={() => setIsDirectSendOpen(false)}
      />
    </>
  );
};

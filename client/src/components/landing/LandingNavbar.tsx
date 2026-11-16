import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe, ArrowRight, ArrowLeft, Menu, X } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';
import { useTheme } from '../../theme/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

export const LandingNavbar: React.FC = () => {
  const { t, language, toggleLanguage, dir } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) {
        const yOffset = -85;
        const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 120);
  };

  return (
    <header className="fixed top-3 inset-x-0 z-50 px-3 sm:px-6 pointer-events-none">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-3.5 sm:px-5 py-2 rounded-full bg-white/90 dark:bg-[#0c1222]/90 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 shadow-lg shadow-black/5 dark:shadow-black/30 pointer-events-auto transition-all">
        {/* Brand Logo & Name */}
        <Link to="/" className="flex items-center gap-2 group shrink-0">
          <img
            src="/logo.png"
            alt="ReachCraft"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
              ReachCraft
            </span>
            <span className="hidden sm:inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-800/60">
              {t('landing.nav.badgeFree')}
            </span>
          </div>
        </Link>

        {/* Desktop Nav Links (Clean, Single Line, No Wrap) */}
        <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap">
          <button
            onClick={() => scrollToSection('features')}
            className="px-3 py-1.5 rounded-full hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            {t('landing.nav.features')}
          </button>
          <button
            onClick={() => scrollToSection('guide')}
            className="px-3 py-1.5 rounded-full hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            {t('landing.nav.guide')}
          </button>
          <button
            onClick={() => scrollToSection('anti-ban')}
            className="px-3 py-1.5 rounded-full hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            {t('landing.nav.antiBan')}
          </button>
          <Link
            to="/developer"
            className="px-3 py-1.5 rounded-full hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            {t('landing.nav.developer')}
          </Link>
          <button
            onClick={() => scrollToSection('tech-stack')}
            className="px-3 py-1.5 rounded-full hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            {t('landing.nav.tech')}
          </button>
          <button
            onClick={() => scrollToSection('faq')}
            className="px-3 py-1.5 rounded-full hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors"
          >
            {t('landing.nav.faq')}
          </button>
        </nav>

        {/* Right Controls: Theme, Language, CTA */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition-all shadow-xs"
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-slate-600 transition-transform hover:-rotate-12" />
            )}
          </button>

          {/* Language Toggle Button */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-[11px] font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all shadow-xs"
            title={language === 'ar' ? 'Switch to English' : 'التحويل إلى العربية'}
          >
            <Globe className="w-3 h-3 text-brand-600 dark:text-brand-400 shrink-0" />
            <span>{language === 'ar' ? 'EN' : 'العربية'}</span>
          </button>

          {/* Workspace CTA Button (Desktop & Tablet) */}
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-xs shadow-brand-500/20 transition-all"
            >
              <span>{t('landing.nav.dashboardBtn')}</span>
              {dir === 'rtl' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-xs shadow-brand-500/20 transition-all"
            >
              <span>{t('landing.nav.signInBtn')}</span>
              {dir === 'rtl' ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          )}

          {/* Mobile Drawer Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-1.5 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden max-w-6xl mx-auto mt-2 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0c1222]/95 backdrop-blur-xl px-4 py-3.5 space-y-2 pointer-events-auto shadow-2xl overflow-hidden"
          >
            {/* Prominent Mobile CTA Button at the Top */}
            <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {t('landing.nav.dashboardBtn')}
                  </span>
                  {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-brand-600 hover:bg-brand-700 active:scale-98 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    {t('landing.nav.signInBtn')}
                  </span>
                  {dir === 'rtl' ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                </button>
              )}
            </div>

            <button
              onClick={() => scrollToSection('features')}
              className="w-full text-start py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            >
              {t('landing.nav.features')}
            </button>
            <button
              onClick={() => scrollToSection('guide')}
              className="w-full text-start py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            >
              {t('landing.nav.guide')}
            </button>
            <button
              onClick={() => scrollToSection('anti-ban')}
              className="w-full text-start py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            >
              {t('landing.nav.antiBan')}
            </button>
            <Link
              to="/developer"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-start py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors block"
            >
              {t('landing.nav.developer')}
            </Link>
            <button
              onClick={() => scrollToSection('tech-stack')}
              className="w-full text-start py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            >
              {t('landing.nav.tech')}
            </button>
            <button
              onClick={() => scrollToSection('faq')}
              className="w-full text-start py-2.5 px-3 rounded-xl text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 transition-colors"
            >
              {t('landing.nav.faq')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

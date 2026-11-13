import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Globe, Sparkles } from 'lucide-react';
import { useTheme } from '../../theme/ThemeContext';
import { useTranslation } from '../../i18n/LanguageContext';

export const TransitionOverlay: React.FC = () => {
  const { themeOverlay } = useTheme();
  const { langOverlay, dir } = useTranslation();

  return (
    <div className="fixed inset-0 pointer-events-none z-[99999] flex items-center justify-center overflow-hidden">
      {/* 1. Theme Change Animated Overlay */}
      <AnimatePresence>
        {themeOverlay && (
          <motion.div
            key={`theme-${themeOverlay}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className={`absolute inset-0 flex items-center justify-center backdrop-blur-md ${
              themeOverlay === 'dark'
                ? 'bg-slate-950/70 text-white'
                : 'bg-white/70 text-slate-900'
            }`}
          >
            {/* Animated expanding radial ripple */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className={`absolute w-96 h-96 rounded-full blur-3xl pointer-events-none ${
                themeOverlay === 'dark'
                  ? 'bg-gradient-to-tr from-brand-600/30 to-indigo-600/30'
                  : 'bg-gradient-to-tr from-amber-400/30 to-brand-400/30'
              }`}
            />

            {/* Floating Glassmorphic Pill */}
            <motion.div
              initial={{ scale: 0.7, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: -15, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className={`relative flex items-center gap-4 px-6 py-4 rounded-3xl shadow-2xl border ${
                themeOverlay === 'dark'
                  ? 'bg-slate-900/90 border-slate-700/80 text-white shadow-brand-950/50'
                  : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-300/40'
              }`}
            >
              <div
                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-xs ${
                  themeOverlay === 'dark'
                    ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
                    : 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                }`}
              >
                {themeOverlay === 'dark' ? (
                  <Moon className="w-6 h-6 animate-pulse" />
                ) : (
                  <Sun className="w-6 h-6 animate-spin" style={{ animationDuration: '6s' }} />
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-extrabold tracking-tight">
                    {themeOverlay === 'dark'
                      ? dir === 'rtl'
                        ? 'الوضع الليلي الحديث'
                        : 'Modern Night Mode'
                      : dir === 'rtl'
                      ? 'الوضع النهاري'
                      : 'Light Mode'}
                  </h4>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    themeOverlay === 'dark' ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  {themeOverlay === 'dark'
                    ? dir === 'rtl'
                      ? 'تصميم أنيق ومريح للعين'
                      : 'Sleek, dark contrast & eye comfort'
                    : dir === 'rtl'
                    ? 'واجهة ناصعة وعالية الوضوح'
                    : 'Crisp, bright & high readability'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Language Change Animated Overlay */}
      <AnimatePresence>
        {langOverlay && (
          <motion.div
            key={`lang-${langOverlay}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-slate-900/50 dark:bg-slate-950/70"
          >
            {/* Animated directional swipe line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="absolute h-1 inset-x-0 top-0 bg-gradient-to-r from-brand-500 via-emerald-500 to-indigo-500"
            />

            {/* Center Floating Glassmorphic Pill */}
            <motion.div
              initial={{ scale: 0.7, rotate: langOverlay === 'ar' ? 8 : -8, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 28 }}
              className="relative flex items-center gap-4 px-7 py-4 rounded-3xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 shadow-2xl"
            >
              <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 flex items-center justify-center border border-brand-200 dark:border-brand-800 shrink-0">
                <Globe className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-base font-black text-slate-900 dark:text-white">
                    {langOverlay === 'ar' ? 'العربية (RTL)' : 'English (LTR)'}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-mono text-[11px] font-bold">
                    {langOverlay === 'ar' ? '🇸🇦 RTL' : '🇬🇧 LTR'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {langOverlay === 'ar'
                    ? 'تم تبديل واجهة التطبيق والاتجاه إلى العربية'
                    : 'Interface & layout switched to English'}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

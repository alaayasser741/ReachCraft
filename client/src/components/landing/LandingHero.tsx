import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Zap,
  Play,
  UserCheck,
  Check,
  Mail,
  ShieldCheck,
  Award,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

export const LandingHero: React.FC = () => {
  const { t, dir } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [heroTab, setHeroTab] = useState<'analysis' | 'extraction'>('analysis');

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -85;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28 bg-gradient-to-b from-slate-100/90 via-emerald-50/25 to-slate-50/80 dark:from-[#060b16] dark:via-[#0a1324] dark:to-[#070c17] border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
      {/* Precision Engineered Architectural Grid Pattern (Human Crafted, Non-AI) */}
      <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1.2px,transparent_1.2px)] [background-size:28px_28px] opacity-35 pointer-events-none" />

      {/* Subtle Focal Center Glow for Headline Legibility */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] lg:w-[850px] max-w-full h-[350px] bg-gradient-to-tr from-brand-500/12 via-emerald-500/10 to-indigo-500/8 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-4xl mx-auto space-y-6">
          {/* Eyebrow Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-300/80 dark:border-emerald-800/80 bg-white/90 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold shadow-xs backdrop-blur-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>{t('landing.hero.badge')}</span>
          </motion.div>

          {/* Main Title */}
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.18] sm:leading-[1.16]"
          >
            {t('landing.hero.titlePart1')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-emerald-500 to-teal-400">
              {t('landing.hero.titleHighlight')}
            </span>{' '}
            {t('landing.hero.titlePart2')}
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed"
          >
            {t('landing.hero.subtitle')}
          </motion.p>

          {/* Hero Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2"
          >
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(user ? '/dashboard' : '/login')}
              rightIcon={dir === 'rtl' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
              className="w-full sm:w-auto px-8 bg-brand-600 hover:bg-brand-700 active:scale-95 text-white shadow-xl shadow-brand-500/25 font-bold rounded-2xl transition-all"
            >
              {t('landing.hero.ctaPrimary')}
            </Button>

            <button
              onClick={() => scrollToSection('guide')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-300/90 dark:border-slate-700 bg-white/80 dark:bg-slate-850/80 backdrop-blur-md text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-bold shadow-xs transition-all"
            >
              <Play className="w-4 h-4 text-brand-600" />
              <span>{t('landing.hero.ctaSecondary')}</span>
            </button>

            <button
              onClick={() => scrollToSection('developer')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              <UserCheck className="w-4 h-4 text-brand-500" />
              <span>{dir === 'rtl' ? 'تعرف على صانع المنصة' : 'Meet the Creator'}</span>
            </button>
          </motion.div>
        </div>

        {/* Proof & Trust Metrics Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-850/80 backdrop-blur-sm text-center shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Zap className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              +71
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
              {t('landing.hero.statCompanies')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('landing.hero.statCompaniesDesc')}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-850/80 backdrop-blur-sm text-center shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Mail className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-brand-600 dark:text-brand-400 font-mono">
              99.2%
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
              {t('landing.hero.statInbox')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('landing.hero.statInboxDesc')}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-850/80 backdrop-blur-sm text-center shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 flex items-center justify-center mx-auto mb-2">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400 font-mono">
              0%
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
              {t('landing.hero.statBanRisk')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('landing.hero.statBanRiskDesc')}</p>
          </div>

          <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-850/80 backdrop-blur-sm text-center shadow-xs">
            <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto mb-2">
              <Award className="w-4 h-4" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-500 font-mono">
              $0
            </div>
            <div className="text-xs font-bold text-slate-600 dark:text-slate-300 mt-1">
              {t('landing.hero.statCost')}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">{t('landing.hero.statCostDesc')}</p>
          </div>
        </div>

        {/* Live Interactive Product Card Simulation (Engineered OS Window) */}
        <div className="mt-12 max-w-5xl mx-auto rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden">
          {/* Mac-style Window Title Bar */}
          <div className="px-4 sm:px-5 py-3.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-rose-500/80 shrink-0" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 shrink-0" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 shrink-0" />
              <span className="font-mono text-slate-400 text-[10px] sm:text-[11px] ms-1 sm:ms-2 truncate max-w-[150px] xs:max-w-[220px] sm:max-w-none">
                reachcraft-core // exhibition-pipeline.engine
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                <Check className="w-3 h-3" /> Live Sandbox
              </span>
            </div>
          </div>

          {/* Interactive Card Body */}
          <div className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-lg font-bold text-white flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <span className="truncate">Cairo_Industrial_Expo_2026.pdf</span>
                    <span className="text-xs font-normal text-slate-400 font-mono">(18.4 MB)</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    Extracted & enriched via Tesseract OCR + Google Gemini 1.5 Pro
                  </p>
                </div>
              </div>

              {/* View Switcher Chips */}
              <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-xl bg-slate-800/80 border border-slate-700 w-full sm:w-auto">
                <button
                  onClick={() => setHeroTab('analysis')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-center transition-all ${
                    heroTab === 'analysis' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  AI Deliverability Audit
                </button>
                <button
                  onClick={() => setHeroTab('extraction')}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold text-center transition-all ${
                    heroTab === 'extraction' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Verified Contacts (71)
                </button>
              </div>
            </div>

            {/* Tab Contents */}
            {heroTab === 'analysis' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 animate-fade-in">
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
                  <span className="text-slate-400 text-xs font-semibold">Gemini Spam Score</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">98 / 100</div>
                  <p className="text-[11px] text-slate-400">Zero spam triggers, personalized merge tags</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
                  <span className="text-slate-400 text-xs font-semibold">Anti-Ban Queue Pace</span>
                  <div className="text-2xl font-black text-brand-400 font-mono">20 - 35s</div>
                  <p className="text-[11px] text-slate-400">Randomized humanized dispatch interval</p>
                </div>
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-800/60 border border-slate-750 space-y-1">
                  <span className="text-slate-400 text-xs font-semibold">Circuit Breaker</span>
                  <div className="text-2xl font-black text-purple-400 font-mono">Active (Armed)</div>
                  <p className="text-[11px] text-slate-400">Auto-halt on bounce spikes or DNS issues</p>
                </div>
              </div>
            )}

            {heroTab === 'extraction' && (
              <div className="overflow-x-auto -mx-1 px-1 scrollbar-thin">
                <div dir="ltr" className="min-w-[440px] space-y-3 animate-fade-in text-left">
                  <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2">
                    <span>Company Name</span>
                    <span>Direct Email</span>
                    <span>Industry</span>
                    <span>Status</span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40">
                    <span className="font-bold text-white">Delta Industrial Systems</span>
                    <span className="text-slate-300 font-mono">info@delta-systems.eg</span>
                    <span className="text-slate-400">Heavy Machinery</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5 border-b border-slate-800/40">
                    <span className="font-bold text-white">Al-Ahram Packaging Co.</span>
                    <span className="text-slate-300 font-mono">contact@ahrampack.com</span>
                    <span className="text-slate-400">Packaging & Logistics</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs py-1.5">
                    <span className="font-bold text-white">Smart Solutions MENA</span>
                    <span className="text-slate-300 font-mono">sales@smartsolutions.ae</span>
                    <span className="text-slate-400">Cloud & IT</span>
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Verified
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

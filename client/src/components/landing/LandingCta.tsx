import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Github } from 'lucide-react';
import { Button } from '../ui/Button';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAuth } from '../../hooks/useAuth';

export const LandingCta: React.FC = () => {
  const { t, dir } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-tr from-brand-900 via-slate-900 to-emerald-950 text-white">
      {/* Engineered subtle mesh grid overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:28px_28px] opacity-10 pointer-events-none" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6 relative z-10">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-white/10 dark:bg-white/5 backdrop-blur-md border border-white/20 p-2.5 flex items-center justify-center shadow-xl">
          <img src="/logo.png" alt="ReachCraft" className="w-full h-full object-contain" />
        </div>

        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight">
          {t('landing.cta.title')}
        </h2>

        <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
          {t('landing.cta.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            rightIcon={dir === 'rtl' ? <ArrowLeft className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />}
            className="w-full sm:w-auto px-8 bg-brand-500 hover:bg-brand-600 text-white shadow-xl shadow-brand-500/30 font-bold rounded-full transition-all"
          >
            {t('landing.cta.btnPrimary')}
          </Button>

          <a
            href="https://github.com/alaayasser741/ReachCraft"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-slate-700 bg-slate-800/80 hover:bg-slate-700/80 text-white text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
          >
            <Github className="w-4 h-4" />
            <span>{t('landing.cta.btnGithub')}</span>
          </a>
        </div>
      </div>
    </section>
  );
};

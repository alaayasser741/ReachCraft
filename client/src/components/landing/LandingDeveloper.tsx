import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Code2,
  CheckCircle2,
  Mail,
  Github,
  Linkedin,
  ExternalLink,
  FileText,
  Sparkles,
  Cpu,
  User,
  Briefcase,
  Phone,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useTranslation } from '../../i18n/LanguageContext';

export const LandingDeveloper: React.FC = () => {
  const { t, dir } = useTranslation();
  const [activeView, setActiveView] = useState<'identity' | 'projects'>('identity');

  const cvLink = 'https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view';

  const shippedProjects = [
    {
      title: 'Creativity in Development Schools (CDS)',
      url: 'https://app.csdc.edu.sa',
      displayUrl: 'app.csdc.edu.sa',
      desc: dir === 'rtl'
        ? 'منصة إدارة مدرسية ثنائية اللغة متكاملة تخدم المدارس السعودية (بوابات للطلاب، أولياء الأمور، المعلمين، الإدارة، والسائقين).'
        : 'Comprehensive bilingual school management platform serving active Saudi schools (student, parent, teacher, admin, and driver portals).',
      tech: ['Next.js', 'React.js', 'TypeScript', 'Tailwind CSS'],
      status: 'Live Production',
    },
    {
      title: 'Gritizer Platform',
      url: 'https://gritizer.com/en',
      displayUrl: 'gritizer.com/en',
      desc: dir === 'rtl'
        ? 'موقع تسويقي متكامل ولوحة تحكم مدربين لمنصة لياقة بدنية SaaS متوفرة على الويب وGoogle Play وApp Store.'
        : 'Marketing website & trainer dashboard for a live SaaS fitness platform available on Web, Google Play, and App Store.',
      tech: ['Next.js', 'React.js', 'Tailwind CSS', 'Client Management'],
      status: 'Live SaaS',
    },
    {
      title: 'Saggaf Optics',
      url: 'https://saggaf.fluencia-sa.com',
      displayUrl: 'saggaf.fluencia-sa.com',
      desc: dir === 'rtl'
        ? 'متجر إلكتروني للنظارات والعدسات مزود بفلاتر قياس وتجربة افتراضية مدعومة بالذكاء الاصطناعي (Deep AI Virtual Try-On).'
        : 'Digital eyewear e-commerce platform with Deep AI-powered virtual try-on filter and medical frame recommendations.',
      tech: ['Next.js', 'Deep AI', 'Virtual Try-On', 'E-Commerce'],
      status: 'Live E-Commerce',
    },
    {
      title: 'Nawah Platform',
      url: 'https://nawah-softwarehouse.com',
      displayUrl: 'nawah-softwarehouse.com',
      desc: dir === 'rtl'
        ? 'منصة مؤسسية ديناميكية فائقة السرعة بـ SSR/SSG ومحرك صفحات حملات تسويقية CMS وأنيميشنز Framer Motion.'
        : 'Dynamic SSR/SSG corporate web platform with Framer Motion animations and custom CMS campaign page builder.',
      tech: ['Next.js', 'Framer Motion', 'SSR/SSG', 'CMS Builder'],
      status: 'Corporate Platform',
    },
    {
      title: 'Stabena E-Commerce Platform',
      url: 'https://stabena.com/en',
      displayUrl: 'stabena.com/en',
      desc: dir === 'rtl'
        ? 'منصة تجارة إلكترونية متعددة التجار ولوحة تحكم لإدارة المنتجات والتصنيفات وتجربة تسوق متجاوبة.'
        : 'Multi-merchant e-commerce platform and merchant dashboard with responsive shopping & inventory flows.',
      tech: ['React.js', 'Next.js', 'Tailwind CSS', 'Multi-Tenant'],
      status: 'Live Multi-Merchant',
    },
  ];

  return (
    <section id="developer" className="py-20 sm:py-28 relative overflow-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Code2 className="w-3.5 h-3.5" />
            <span>{t('landing.developer.badge')}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {dir === 'rtl' ? 'علاء عبدالله (Alaa Abdullah)' : 'Alaa Abdullah'}
          </h2>

          <p className="text-sm sm:text-base font-semibold mt-0.5 text-slate-500">
            Mid-Level Frontend Engineer <a href="https://nawah-softwarehouse.com/" target="_blank" rel="noreferrer" className='text-brand-600 dark:text-brand-400'>@ Nawah Software House</a>
          </p>

          <div className="pt-2">
            <Link
              to="/developer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
            >
              <User className="w-3.5 h-3.5" />
              <span>{dir === 'rtl' ? 'عرض صفحة البورتفوليو المنفصلة للمطور ←' : 'View Full Dedicated Portfolio Page →'}</span>
            </Link>
          </div>
        </div>

        {/* Sleek Segmented View Switcher: Identity Card vs Shipped Projects */}
        <div className="flex items-center justify-center mb-8">
          <div className="grid grid-cols-2 w-full max-w-sm sm:max-w-md p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200/90 dark:border-slate-700 shadow-inner">
            <button
              onClick={() => setActiveView('identity')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-5 rounded-xl text-[11px] sm:text-sm font-bold transition-all ${activeView === 'identity'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{dir === 'rtl' ? 'بطاقة الهوية' : 'Identity Card'}</span>
            </button>

            <button
              onClick={() => setActiveView('projects')}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-3 sm:px-5 rounded-xl text-[11px] sm:text-sm font-bold transition-all ${activeView === 'projects'
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
            >
              <Briefcase className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="truncate">{dir === 'rtl' ? 'المشاريع المنشورة' : 'Live Projects'}</span>
            </button>
          </div>
        </div>

        {/* VIEW 1: DEVELOPER IDENTITY CARD */}
        {activeView === 'identity' && (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-10 shadow-xl space-y-6 sm:space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 border-b border-slate-100 dark:border-slate-800 pb-8">
              {/* Avatar with animated halo and personal photo */}
              <div className="relative shrink-0">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-brand-600 via-emerald-600 to-indigo-600 p-1 shadow-xl shadow-brand-500/25">
                  <div className="w-full h-full rounded-[22px] overflow-hidden bg-slate-950 flex items-center justify-center">
                    <img
                      src="/developer.jpg"
                      alt="Alaa Abdullah"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
                <div className="absolute -bottom-2 -right-2 p-1.5 rounded-xl bg-emerald-500 text-white shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>

              {/* Bio & Intro */}
              <div className="text-center sm:text-start space-y-3 flex-1">
                <div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                    {dir === 'rtl' ? 'م/ علاء عبدالله (Alaa Abdullah)' : 'Eng. Alaa Abdullah'}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold mt-0.5 text-slate-500">
                    Mid-Level Frontend Engineer <a href="https://nawah-softwarehouse.com/" target="_blank" rel="noreferrer" className='text-brand-600 dark:text-brand-400'>@ Nawah Software House</a>
                  </p>
                </div>

                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {t('landing.developer.bio')}
                </p>

                {/* Direct Action Link Pills (Including Direct CV Button) */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-2">
                  <a
                    href={cvLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{dir === 'rtl' ? 'عرض السيرة الذاتية (Google Drive CV)' : 'Download CV (PDF)'}</span>
                    <ExternalLink className="w-3 h-3 ms-0.5 opacity-80" />
                  </a>

                  <a
                    href="mailto:alaaabdullah.dev@gmail.com"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-950/60 dark:hover:text-brand-300 transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5 text-brand-600" />
                    <span>alaaabdullah.dev@gmail.com</span>
                  </a>

                  <a
                    href="https://github.com/alaayasser741"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    <Github className="w-3.5 h-3.5" />
                    <span>GitHub</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://linkedin.com/in/alaa-abdullah-dev"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/60 dark:hover:text-blue-300 transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                    <span>LinkedIn</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <a
                    href="https://alaa-abdullah.netlify.app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-brand-50 hover:text-brand-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-brand-600" />
                    <span>{dir === 'rtl' ? 'معرض الأعمال' : 'Portfolio'}</span>
                  </a>

                  <a
                    href="tel:+201556774943"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-50 hover:text-emerald-700 transition-colors font-mono"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span dir="ltr">+20 155 677 4943</span>
                  </a>
                </div>
              </div>
            </div>

            {/* The Story & Motivation */}
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-600" />
                <span>{t('landing.developer.storyTitle')}</span>
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-100 dark:border-slate-800">
                {t('landing.developer.story')}
              </p>
            </div>

            {/* Engineering Arsenal / Skills */}
            <div className="space-y-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-emerald-600" />
                <span>{t('landing.developer.skillsTitle')}</span>
              </h4>
              <div className="flex flex-wrap gap-2 text-xs font-medium">
                {[
                  'React 18 & Next.js',
                  'TypeScript',
                  'Tailwind CSS & shadcn/ui',
                  'Framer Motion',
                  'Node.js & Express REST APIs',
                  'Better-SQLite3 & Performance',
                  'Google Gemini 1.5 Pro (AI Studio)',
                  'SMTP & Anti-Ban Architecture',
                  'RFC 8058 Compliance',
                  'Bi-directional Email Sync',
                  'Full RTL Arabic & English i18n',
                ].map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[11px]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: SHIPPED LIVE PROJECTS */}
        {activeView === 'projects' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-fade-in max-w-6xl mx-auto">
            {shippedProjects.map((proj, idx) => (
              <div
                key={idx}
                className="p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-850 flex flex-col justify-between hover:border-brand-500/50 hover:shadow-lg transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="brand" size="sm">{proj.status}</Badge>
                    <a
                      href={proj.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-brand-600 dark:text-brand-400 font-mono hover:underline flex items-center gap-1"
                    >
                      {proj.displayUrl}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {proj.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {proj.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {proj.tech.map((tItem, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300"
                    >
                      {tItem}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Dedicated Full Portfolio Page Link Banner */}
        <div className="mt-12 text-center">
          <Link
            to="/developer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs sm:text-sm shadow-xl transition-all"
          >
            <span>{dir === 'rtl' ? 'استكشف صفحة البورتفوليو المنفصلة والسيرة الذاتية الكاملة' : 'Explore Dedicated Standalone Portfolio & Resume Page'}</span>
            <ExternalLink className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>
      </div>
    </section>
  );
};

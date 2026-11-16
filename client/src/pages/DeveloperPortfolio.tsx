import React, { useState, useEffect } from 'react';
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
  ArrowRight,
  ArrowLeft,
  Sun,
  Moon,
  Globe,
  Layers,
  Zap,
  Shield,
  Copy,
  Check,
  Send,
  Download,
  Terminal,
  Server,
  Workflow,
  Boxes,
  Flame,
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { useTheme } from '../theme/ThemeContext';
import { useToast } from '../components/ui/Toast';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DeveloperPortfolio: React.FC = () => {
  const { t, dir, language, toggleLanguage } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { success: toastSuccess } = useToast();

  const isAr = dir === 'rtl';
  const cvLink = 'https://drive.google.com/file/d/1AwwZPxL2alQrUaB6z_XWOB7tLVdKJepq/view';
  const email = 'alaaabdullah.dev@gmail.com';
  const phone = '+20 155 677 4943';
  const rawPhone = '+201556774943';
  const githubUrl = 'https://github.com/alaayasser741';
  const linkedinUrl = 'https://linkedin.com/in/alaa-abdullah-dev';
  const portfolioUrl = 'https://alaa-abdullah.netlify.app';

  const [activeProjectFilter, setActiveProjectFilter] = useState<'all' | 'saas' | 'enterprise' | 'ecommerce'>('all');
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const copyToClipboard = (text: string, type: 'email' | 'phone') => {
    navigator.clipboard.writeText(text);
    if (type === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      toastSuccess(isAr ? 'تم نسخ البريد الإلكتروني للحافظة' : 'Email copied to clipboard');
    } else {
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
      toastSuccess(isAr ? 'تم نسخ رقم الهاتف للحافظة' : 'Phone copied to clipboard');
    }
  };

  const projects = [
    {
      id: 'reachcraft',
      category: 'saas',
      title: isAr ? 'منصة ReachCraft السحابية' : 'ReachCraft Cloud Platform',
      tagline: isAr ? 'منصة ذكية متكاملة لاستخراج بيانات المعارض وأتمتة التواصل البارد' : 'AI B2B Exhibition Lead Extraction & Cold Outreach SaaS',
      url: 'https://reachcraft.fly.dev',
      displayUrl: 'reachcraft.fly.dev',
      desc: isAr
        ? 'بناء منصة SaaS كاملة من الصفر تستخرج جهات الاتصال من كتالوجات المعارض والـ PDF، مدعومة برادار لفحص جودة الرسائل ومؤشر السبام بـ Google Gemini، وخوارزميات إرسال بشرية مانعة للحظر (Anti-Ban)، وتزامن بريدي ثنائي الاتجاه (SMTP/IMAP) مع دعم كامل للغتين العربية والإنجليزية.'
        : 'Engineered a production-ready B2B SaaS platform from scratch. Features AI-powered directory OCR, Gemini AI deliverability audit, humanized SMTP anti-ban dispatch pacing, RFC 8058 one-click unsubscribe, and two-way IMAP email sync with full RTL Arabic and English support.',
      tech: ['React 18', 'Next.js App Router', 'TypeScript', 'Tailwind CSS', 'shadcn/ui', 'Node.js Express', 'better-sqlite3', 'Google Gemini AI', 'Nodemailer & IMAPFlow', 'Docker & Fly.io'],
      status: 'Live Production SaaS',
      featured: true,
    },
    {
      id: 'cds',
      category: 'enterprise',
      title: 'Creativity in Development Schools (CDS)',
      tagline: isAr ? 'منصة تخطيط موارد وإدارة مدارس سعودية متكاملة' : 'Comprehensive Saudi School ERP & Management Platform',
      url: 'https://app.csdc.edu.sa',
      displayUrl: 'app.csdc.edu.sa',
      desc: isAr
        ? 'منصة مؤسسية ضخمة تخدم آلاف الطلاب والمعلمين في المملكة العربية السعودية. تضم بوابات مخصصة لكل فئة: بوابة الطالب، ولي الأمر، المعلم، الإدارة، ومشرفي النقل المدرسي مع تجربة متجاوبة وسريعة.'
        : 'Comprehensive bilingual school enterprise platform serving thousands of active users across Saudi schools, with dedicated custom portals for students, parents, teachers, administrators, and drivers.',
      tech: ['Next.js', 'React.js', 'TypeScript', 'Tailwind CSS', 'Role-Based Access Control', 'REST APIs'],
      status: 'Live Enterprise ERP',
      featured: true,
    },
    {
      id: 'gritizer',
      category: 'saas',
      title: 'Gritizer SaaS Platform',
      tagline: isAr ? 'منصة لياقة بدنية SaaS متكاملة وإدارة تدريب' : 'Fitness SaaS Platform & Multi-Platform Web/Mobile Ecosystem',
      url: 'https://gritizer.com/en',
      displayUrl: 'gritizer.com/en',
      desc: isAr
        ? 'الموقع التسويقي ولوحة تحكم المدربين لمنصة لياقة بدنية SaaS متوفرة على الويب ومتاجر التطبيقات (Google Play & App Store). تشمل إدارة العملاء والاشتراكات ومتابعة التمارين والتغذية.'
        : 'Marketing web application & specialized trainer dashboard for a live fitness SaaS ecosystem operating across Web, Google Play, and App Store with subscription management and performance tracking.',
      tech: ['Next.js', 'React.js', 'Tailwind CSS', 'Client Management', 'Internationalization'],
      status: 'Live SaaS',
      featured: false,
    },
    {
      id: 'saggaf',
      category: 'ecommerce',
      title: 'Saggaf Optics',
      tagline: isAr ? 'متجر بصريات ذكي مزود بتجربة قياس افتراضية بالذكاء الاصطناعي' : 'Deep AI Virtual Try-On Eyewear E-Commerce',
      url: 'https://saggaf.fluencia-sa.com',
      displayUrl: 'saggaf.fluencia-sa.com',
      desc: isAr
        ? 'متجر إلكتروني فاخر للنظارات والعدسات مزود بخاصية التجربة الافتراضية للعدسات والإطارات بالذكاء الاصطناعي (Deep AI Virtual Try-On) وتوصيات طبية مخصصة حسب قياسات الوجه.'
        : 'High-end eyewear e-commerce platform integrated with Deep AI-powered virtual try-on technology, facial measurement filters, and medical lens recommendation engines.',
      tech: ['Next.js', 'Deep AI', 'Virtual Try-On', 'E-Commerce Checkout', 'Tailwind CSS'],
      status: 'Live E-Commerce',
      featured: false,
    },
    {
      id: 'nawah',
      category: 'enterprise',
      title: 'Nawah Software House Platform',
      tagline: isAr ? 'منصة الشركة الرسمية ومحرك صفحات الحملات الديناميكية' : 'Corporate SSR/SSG Platform & Dynamic CMS Campaign Builder',
      url: 'https://nawah-softwarehouse.com',
      displayUrl: 'nawah-softwarehouse.com',
      desc: isAr
        ? 'الموقع المؤسسي الرسمي لشركة نواة للبرمجيات مبني بأحدث تقنيات SSR و SSG مع أنيميشنز Framer Motion فائقة السلاسة، ومحرك مخصص لبناء صفحات الهبوط والحملات التسويقية.'
        : 'Official corporate web platform built with Next.js SSR/SSG architecture, fluid Framer Motion animations, and a custom marketing campaign landing page engine.',
      tech: ['Next.js', 'Framer Motion', 'SSR / SSG', 'Custom CMS Builder', 'SEO Optimization'],
      status: 'Corporate Platform',
      featured: false,
    },
    {
      id: 'stabena',
      category: 'ecommerce',
      title: 'Stabena E-Commerce Platform',
      tagline: isAr ? 'منصة تجارة إلكترونية متعددة المتاجر والتجار' : 'Multi-Merchant E-Commerce & Merchant Dashboard',
      url: 'https://stabena.com/en',
      displayUrl: 'stabena.com/en',
      desc: isAr
        ? 'منصة تسوق متكاملة تدعم تعدد التجار ولوحة تحكم لإدارة المنتجات والطلبات والتصنيفات مع تجربة شراء سلسة عبر الهاتف وسطح المكتب.'
        : 'Scalable multi-tenant e-commerce marketplace and merchant backoffice for managing catalog inventory, orders, and optimized checkout funnels.',
      tech: ['React.js', 'Next.js', 'Tailwind CSS', 'Multi-Tenant Architecture', 'REST APIs'],
      status: 'Live Multi-Merchant',
      featured: false,
    },
  ];

  const filteredProjects = activeProjectFilter === 'all'
    ? projects
    : projects.filter((p) => p.category === activeProjectFilter);

  const skillsList = [
    {
      category: isAr ? 'واجهات المستخدم (Frontend Mastery)' : 'Frontend Mastery',
      icon: Code2,
      skills: [
        'React 18 & React 19',
        'Next.js (App & Pages Router)',
        'TypeScript (Strict)',
        'Tailwind CSS & CSS Variables',
        'shadcn/ui & Radix Primitives',
        'Framer Motion (Animations & Micro-interactions)',
        'HTML5 Semantic Standards & Responsive Design',
      ],
    },
    {
      category: isAr ? 'البنية البرمجية وجودة التطوير' : 'Architecture & Quality',
      icon: Layers,
      skills: [
        'Clean Component Architecture (One Component = One Job)',
        'RTL Arabic & LTR English i18n (next-intl / LanguageContext)',
        'Web Accessibility (WCAG 2.2 AA Compliance)',
        'Core Web Vitals & Extreme Performance (Lighthouse 95+)',
        'Design Systems & Reusable Token Architectures',
      ],
    },
    {
      category: isAr ? 'إدارة الحالة وربط السيرفر' : 'State & Full-Stack Integration',
      icon: Server,
      skills: [
        'TanStack Query (React Query)',
        'Redux Toolkit & Zustand',
        'Node.js & Express RESTful APIs',
        'better-sqlite3 & PostgreSQL / Drizzle ORM',
        'JWT Auth & Google OAuth 2.0 Integration',
      ],
    },
    {
      category: isAr ? 'الذكاء الاصطناعي وهندسة الإرسال' : 'AI & Systems Engineering',
      icon: Cpu,
      skills: [
        'Google Gemini AI SDK (@google/genai)',
        'OCR PDF & Catalog Extraction Pipelines',
        'SMTP Outbound & Anti-Ban Humanized Pacing',
        'RFC 8058 One-Click Unsubscribe Standard',
        'Two-Way IMAP Sync & Email Threading',
        'Docker & Cloud Deployments (Fly.io, Vercel, Netlify)',
      ],
    },
  ];

  return (
    <div
      dir={dir}
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-brand-500 selection:text-white"
    >
      {/* ========================================================= */}
      {/* 1. TOP STICKY NAVIGATION BAR                              */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200/80 dark:border-slate-800/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand / Name */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-brand-600 dark:hover:text-brand-400 transition-colors me-2 border-e border-slate-200 dark:border-slate-800 pe-3"
              title={isAr ? 'العودة لمنصة ReachCraft' : 'Back to ReachCraft Platform'}
            >
              {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">ReachCraft</span>
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-emerald-500 p-0.5 shadow-md shadow-brand-500/20">
                <img
                  src="/developer.jpg"
                  alt="Alaa Abdullah"
                  className="w-full h-full object-cover rounded-[10px]"
                />
              </div>
              <div>
                <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white block leading-tight">
                  {isAr ? 'علاء عبدالله' : 'Alaa Abdullah'}
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 block font-mono">
                  Frontend Engineer
                </span>
              </div>
            </div>
          </div>

          {/* Center Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#about" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {isAr ? 'نبذة عني' : 'About'}
            </a>
            <a href="#projects" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {isAr ? 'المشاريع المنشورة' : 'Projects'}
            </a>
            <a href="#skills" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {isAr ? 'المهارات التقنية' : 'Skills'}
            </a>
            <a href="#contact" className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
              {isAr ? 'تواصل معي' : 'Contact'}
            </a>
          </nav>

          {/* Right Controls: Theme + Language + CV Button */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={isAr ? 'تبديل المظهر' : 'Toggle Theme'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-colors"
              title={isAr ? 'Switch to English' : 'التحويل إلى العربية'}
            >
              <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              <span>{language === 'ar' ? 'English' : 'العربية'}</span>
            </button>

            {/* Direct CV Button */}
            <a
              href={cvLink}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-brand-500/25 transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isAr ? 'السيرة الذاتية (CV)' : 'Download CV'}</span>
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION: PROFILE & VALUE PROPOSITION              */}
      {/* ========================================================= */}
      <section id="about" className="py-16 sm:py-24 relative overflow-hidden">
        {/* Subtle Ambient Glow Elements */}
        <div className="absolute top-1/4 start-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-to-tr from-brand-500/10 via-emerald-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-12">
            
            {/* Developer Photo with Ring & Badge */}
            <div className="relative shrink-0">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl bg-gradient-to-tr from-brand-600 via-emerald-500 to-indigo-600 p-1.5 shadow-2xl shadow-brand-500/30">
                <div className="w-full h-full rounded-[20px] overflow-hidden bg-slate-900">
                  <img
                    src="/developer.jpg"
                    alt="Alaa Abdullah"
                    className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                  />
                </div>
              </div>
              <div
                className="absolute -bottom-2 -right-2 p-2 rounded-2xl bg-emerald-500 text-white shadow-lg border-2 border-white dark:border-slate-900"
                title={isAr ? 'مهندس موثق ومتاح للعمل' : 'Verified Software Engineer'}
              >
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* Profile Info & Core Pitch */}
            <div className="flex-1 text-center md:text-start space-y-4">
              {/* Availability Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>{isAr ? 'متاح للفرص والمشاريع المتميزة' : 'Available for High-Impact Engineering Roles'}</span>
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                  {isAr ? 'م/ علاء عبدالله' : 'Eng. Alaa Abdullah'}
                </h1>
                <p className="text-base sm:text-lg font-bold text-brand-600 dark:text-brand-400 mt-1">
                  Mid-Level Frontend Engineer{' '}
                  <a
                    href="https://nawah-softwarehouse.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 dark:text-slate-300 hover:text-brand-600 dark:hover:text-brand-400 underline decoration-slate-300 dark:decoration-slate-700 transition-colors"
                  >
                    @ Nawah Software House
                  </a>
                </p>
              </div>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                {isAr
                  ? 'مهندس برمجيات واجهات وتطبيقات ويب متخصص في React.js و Next.js و TypeScript، بخبرة عملية تتجاوز 3 سنوات في إطلاق منصات الإنتاج الحية (SaaS, EdTech, E-Commerce). أركز بعمق على نظافة البنية المعمارية (Clean Architecture)، السرعة الفائقة، وتجارب المستخدم المتجاوبة ثنائية اللغة (RTL/LTR).'
                  : 'Software Engineer with 3+ years of production experience building high-scale web platforms, enterprise ERPs, and B2B SaaS applications with React.js, Next.js, and TypeScript. Obsessed with extreme performance, clean component design systems, and resilient Arabic (RTL) & English (LTR) user experiences.'}
              </p>

              {/* Action Buttons & Quick Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 pt-2">
                <a
                  href={cvLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all"
                >
                  <Download className="w-4 h-4" />
                  <span>{isAr ? 'عرض وتحميل الـ CV (Google Drive)' : 'View & Download CV (PDF)'}</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                </a>

                <a
                  href={`https://wa.me/${rawPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    isAr
                      ? 'مرحباً م/ علاء، اطلعت على البورتفوليو وأود التواصل معك بخصوص فرصة عمل/مشروع.'
                      : 'Hi Alaa, I checked your portfolio and would like to discuss an opportunity/project.'
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs sm:text-sm font-bold shadow-md transition-all"
                >
                  <Send className="w-4 h-4 text-emerald-500" />
                  <span>{isAr ? 'تواصل عبر واتساب' : 'Chat on WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => copyToClipboard(email, 'email')}
                  className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:border-brand-500 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-600" />
                  <span>{email}</span>
                  {copiedEmail ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              {/* Social & Code Presence Links */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1 text-xs">
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>

                <a
                  href={linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-blue-600 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-blue-600" />
                  <span>LinkedIn</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>

                <a
                  href={portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-brand-600 transition-colors"
                >
                  <Globe className="w-3.5 h-3.5 text-brand-600" />
                  <span>Netlify Portfolio</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>

                <a
                  href={`tel:${rawPhone}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition-colors font-mono"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span dir="ltr">{phone}</span>
                </a>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. CORE METRICS / PROVEN PRODUCTION STATS                 */}
      {/* ========================================================= */}
      <section className="py-8 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 text-center">
            
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="block text-2xl sm:text-3xl font-black text-brand-600 dark:text-brand-400 font-mono">
                3+
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                {isAr ? 'سنوات خبرة عملية موثقة' : 'Years Production Experience'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="block text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                6+
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                {isAr ? 'منصات حية تعمل في الإنتاج' : 'Live Enterprise & SaaS Platforms'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="block text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                98%+
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                {isAr ? 'معايير الأداء والـ Core Web Vitals' : 'Lighthouse Performance Score'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800">
              <span className="block text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">
                100%
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 block">
                {isAr ? 'دعم العربية والإنجليزية (RTL / i18n)' : 'Full RTL Arabic & English i18n'}
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. SHIPPED LIVE PROJECTS SHOWCASE (PORTFOLIO GALLERY)     */}
      {/* ========================================================= */}
      <section id="projects" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>{isAr ? 'المشاريع المنشورة والأعمال الحية' : 'Shipped Live Projects'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'مشاريع حقيقية تعمل بكفاءة على الإنترنت' : 'Real Production Systems Shipped to Real Users'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {isAr
              ? 'كل مشروع أدناه هو منصة حقيقية منشورة ولها رابط مباشر يمكنك زيارته وتجربته فوراً.'
              : 'Every project below is a deployed, live production web application that you can visit and verify immediately.'}
          </p>

          {/* Filter Tabs */}
          <div className="flex items-center justify-center pt-4">
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700">
              {[
                { id: 'all', label: isAr ? 'جميع المشاريع' : 'All Projects' },
                { id: 'saas', label: isAr ? 'منصات SaaS والذكاء الاصطناعي' : 'SaaS & AI' },
                { id: 'enterprise', label: isAr ? 'منصات المدارس والمؤسسات' : 'EdTech & Enterprise' },
                { id: 'ecommerce', label: isAr ? 'المتاجر والتجارة الإلكترونية' : 'E-Commerce' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveProjectFilter(tab.id as any)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeProjectFilter === tab.id
                      ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`rounded-3xl border bg-white dark:bg-slate-900 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                project.featured
                  ? 'border-brand-500/60 shadow-lg shadow-brand-500/5 ring-1 ring-brand-500/20'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="space-y-3.5">
                {/* Status & Live Link Header */}
                <div className="flex items-center justify-between">
                  <Badge variant={project.featured ? 'brand' : 'outline'} size="sm">
                    {project.status}
                  </Badge>

                  <a
                    href={project.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono font-bold text-brand-600 dark:text-brand-400 hover:underline"
                  >
                    <span>{project.displayUrl}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {/* Project Title & Tagline */}
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    {project.title}
                    {project.featured && <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />}
                  </h3>
                  <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">
                    {project.tagline}
                  </p>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {project.desc}
                </p>
              </div>

              {/* Tech Stack Chips & Action Link */}
              <div className="pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex flex-wrap gap-1.5">
                  {project.tech.map((tItem, tIdx) => (
                    <span
                      key={tIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300 font-mono"
                    >
                      {tItem}
                    </span>
                  ))}
                </div>

                <a
                  href={project.url}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-brand-50 dark:bg-slate-800 dark:hover:bg-brand-950/60 text-slate-800 dark:text-slate-200 hover:text-brand-600 dark:hover:text-brand-400 text-xs font-bold transition-colors"
                >
                  <span>{isAr ? 'معاينة المشروع الحي' : 'Visit Live Platform'}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. TECHNICAL ARSENAL & SKILLS MATRIX                      */}
      {/* ========================================================= */}
      <section id="skills" className="py-20 bg-slate-100/60 dark:bg-slate-900/60 border-y border-slate-200/80 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-bold">
              <Cpu className="w-3.5 h-3.5" />
              <span>{isAr ? 'الترسانة التقنية والمهارات' : 'Engineering Arsenal'}</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {isAr ? 'التقنيات والأدوات التي أتقنها وأستخدمها يومياً' : 'Core Technologies & Architectural Competencies'}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {skillsList.map((skillGroup, idx) => {
              const IconComp = skillGroup.icon;
              return (
                <div
                  key={idx}
                  className="p-6 rounded-3xl bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-800 shadow-md space-y-4"
                >
                  <div className="flex items-center gap-2.5 border-b pb-3 border-slate-100 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                      {skillGroup.category}
                    </h3>
                  </div>

                  <ul className="space-y-2">
                    {skillGroup.skills.map((s, sIdx) => (
                      <li key={sIdx} className="flex items-start gap-2 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. THE STORY BEHIND REACHCRAFT & PHILOSOPHY               */}
      {/* ========================================================= */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-900 via-slate-900 to-emerald-950 text-white shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <Sparkles className="w-4 h-4" />
            <span>{isAr ? 'رؤية وفلسفة التطوير' : 'Engineering Vision & Philosophy'}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {isAr ? 'قصة بناء ReachCraft: من المشكلة الواقعية إلى منتج حي' : 'Why ReachCraft: Solving Real Problems with Code'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {isAr
              ? 'بعد متابعة المعارض والمؤتمرات التجارية، لفت انتباهي هدر هائل للفرص بعد انتهاء الحدث: مئات الشركات تنفق مبالغ ضخمة على المعارض، ثم تنتهي كتالوجات وبيانات الشركات في الأدراج أو تتطلب أسابيع من التفريغ اليدوي المرهق. وعند اللجوء للأدوات المتاحة، يصطدم المستخدم باشتراكات شهرية باهظة أو يتعرض حسابه للحظر الفوري بسبب الإرسال العشوائي.'
              : 'Having observed B2B trade shows, I noticed a massive bottleneck: companies invest thousands to attend exhibitions, only for contact directories and scanned catalogs to gather dust in spreadsheets. Existing tools charge outrageous monthly subscriptions and frequently get user sender domains blacklisted.'}
          </p>

          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal">
            {isAr
              ? 'بنيت منصة ReachCraft كحل متكامل ومرن: نموذج ذكاء اصطناعي يستخرج البيانات ويفحص جودة الرسائل، وخوارزميات إرسال تحاكي السلوك البشري لحماية السمعة، مع صندوق وارد موحد وترجمة فورية. هذا النموذج يجسد منهجي في العمل: تحويل المتطلبات المعقدة إلى حلول هندسية متينة وسلسة للمستخدم النهائي.'
              : 'I built ReachCraft to bridge this gap: OCR & AI parsing for trade catalogs, Gemini AI deliverability audit to beat spam filters, randomized human pacing for zero ban risk, and two-way email sync. This project encapsulates my engineering DNA: full ownership from architecture and database to responsive frontend and live cloud deployment.'}
          </p>

          <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/10 p-0.5">
                <img src="/developer.jpg" alt="Alaa" className="w-full h-full object-cover rounded-lg" />
              </div>
              <div>
                <span className="font-bold text-sm block">Alaa Abdullah</span>
                <span className="text-[11px] text-emerald-400 block font-mono">Frontend Engineer</span>
              </div>
            </div>

            <a
              href={cvLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white text-slate-900 font-bold text-xs hover:bg-slate-100 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? 'عرض السيرة الذاتية' : 'View Full Resume'}</span>
            </a>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. CONTACT & GET IN TOUCH SECTION                         */}
      {/* ========================================================= */}
      <section id="contact" className="py-20 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Mail className="w-3.5 h-3.5" />
            <span>{isAr ? 'دعنا نتواصل ونبني معاً' : "Let's Connect & Build Together"}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isAr ? 'جاهز للانضمام لفريقك أو قيادة مشروعك القادم' : 'Ready to Elevate Your Frontend & Product Engineering'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl mx-auto leading-relaxed">
            {isAr
              ? 'سواء كنت تبحث عن مهندس واجهات متمكن (Frontend Engineer)، أو ترغب في مناقشة فرصة عمل بدوام كامل أو مشروع واعد، يسعدني دائماً تواصلك.'
              : 'Whether you have an exciting full-time opportunity, a high-impact contract, or a project in mind, my inbox is always open.'}
          </p>

          {/* Quick Contact Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 max-w-2xl mx-auto">
            {/* WhatsApp */}
            <a
              href={`https://wa.me/${rawPhone.replace(/\D/g, '')}?text=${encodeURIComponent(
                isAr
                  ? 'مرحباً م/ علاء، أود التواصل معك بخصوص فرصة عمل واعدة.'
                  : 'Hi Alaa, I would like to discuss an engineering opportunity with you.'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Send className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">WhatsApp</span>
              <span className="text-[11px] text-slate-500 font-mono block" dir="ltr">{phone}</span>
            </a>

            {/* Email */}
            <button
              type="button"
              onClick={() => copyToClipboard(email, 'email')}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-brand-500 hover:shadow-md transition-all text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Mail className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">Email</span>
              <span className="text-[11px] text-slate-500 block truncate">{email}</span>
            </button>

            {/* LinkedIn */}
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:shadow-md transition-all text-center space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                <Linkedin className="w-5 h-5" />
              </div>
              <span className="font-bold text-xs text-slate-900 dark:text-white block">LinkedIn</span>
              <span className="text-[11px] text-slate-500 block">/in/alaa-abdullah-dev</span>
            </a>
          </div>

          <div className="pt-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline"
            >
              <span>{isAr ? '← العودة إلى الصفحة الرئيسية لمنصة ReachCraft' : '← Return to ReachCraft Platform'}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. FOOTER                                                 */}
      {/* ========================================================= */}
      <footer className="py-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500">
        <p>
          {isAr
            ? `تم التصميم والبرمجة بواسطة م/ علاء عبدالله • © ${new Date().getFullYear()} جميع الحقوق محفوظة`
            : `Designed & Built by Eng. Alaa Abdullah • © ${new Date().getFullYear()} All rights reserved.`}
        </p>
      </footer>
    </div>
  );
};

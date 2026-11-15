import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  UploadCloud,
  Sparkles,
  ShieldCheck,
  Globe,
  Play,
  Check,
} from 'lucide-react';
import { Badge } from '../ui/Badge';
import { useTranslation } from '../../i18n/LanguageContext';

export const LandingLab: React.FC = () => {
  const { dir } = useTranslation();
  const [activeLabStation, setActiveLabStation] = useState<'scanner' | 'spamRadar' | 'antiBan' | 'translator'>('scanner');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedItemsCount, setScannedItemsCount] = useState(71);
  const [spamFilterMode, setSpamFilterMode] = useState<'risky' | 'polished'>('polished');
  const [isQueueRunning, setIsQueueRunning] = useState(false);
  const [isTranslated, setIsTranslated] = useState(true);

  const runLaserScan = () => {
    setIsScanning(true);
    setScannedItemsCount(0);
    const interval = setInterval(() => {
      setScannedItemsCount((prev) => {
        if (prev >= 71) {
          clearInterval(interval);
          setIsScanning(false);
          return 71;
        }
        return prev + 14;
      });
    }, 280);
  };

  return (
    <section id="guide" className="py-20 sm:py-28 bg-slate-50/80 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>{dir === 'rtl' ? 'معمل المنصة التفاعلي الحي' : 'Interactive Outreach Laboratory'}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {dir === 'rtl' ? 'جرّب دورة العمل كاملة بنفسك الآن' : 'Test-Drive the Full Pipeline in Real Time'}
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400">
            {dir === 'rtl'
              ? 'أربعة معامل تفاعلية تمكنك من تجربة محرك المسح بالليزر، رادار كشف السبام بـ AI، الإرسال البشري الآمن، والمترجم الفوري.'
              : 'Four live interactive stations: Test our OCR laser scanner, Gemini AI spam radar, anti-ban pacing engine, and real-time translator.'}
          </p>
        </div>

        {/* Connected Flow Navigator Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-4xl mx-auto mb-8">
          <button
            onClick={() => setActiveLabStation('scanner')}
            className={`p-3.5 rounded-2xl border text-start transition-all ${
              activeLabStation === 'scanner'
                ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/25 ring-2 ring-brand-500/30'
                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <UploadCloud className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs">1. {dir === 'rtl' ? 'ماسح الكتالوج' : 'OCR Scanner'}</span>
            </div>
            <p className={`text-[11px] truncate ${activeLabStation === 'scanner' ? 'text-brand-100' : 'text-slate-400'}`}>
              {dir === 'rtl' ? 'استخراج الشركات بالليزر' : 'Instant PDF Laser Extraction'}
            </p>
          </button>

          <button
            onClick={() => setActiveLabStation('spamRadar')}
            className={`p-3.5 rounded-2xl border text-start transition-all ${
              activeLabStation === 'spamRadar'
                ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/25 ring-2 ring-purple-500/30'
                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs">2. {dir === 'rtl' ? 'رادار السبام' : 'Spam Radar'}</span>
            </div>
            <p className={`text-[11px] truncate ${activeLabStation === 'spamRadar' ? 'text-purple-100' : 'text-slate-400'}`}>
              {dir === 'rtl' ? 'مؤشر الوصول والـ AI' : 'Gemini AI Deliverability'}
            </p>
          </button>

          <button
            onClick={() => setActiveLabStation('antiBan')}
            className={`p-3.5 rounded-2xl border text-start transition-all ${
              activeLabStation === 'antiBan'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500/30'
                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs">3. {dir === 'rtl' ? 'طابور الأمان' : 'Anti-Ban Queue'}</span>
            </div>
            <p className={`text-[11px] truncate ${activeLabStation === 'antiBan' ? 'text-emerald-100' : 'text-slate-400'}`}>
              {dir === 'rtl' ? 'فواصل بشرية 20-35s' : 'Humanized 20-35s Delays'}
            </p>
          </button>

          <button
            onClick={() => setActiveLabStation('translator')}
            className={`p-3.5 rounded-2xl border text-start transition-all ${
              activeLabStation === 'translator'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/25 ring-2 ring-blue-500/30'
                : 'bg-white dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Globe className="w-4 h-4 shrink-0" />
              <span className="font-bold text-xs">4. {dir === 'rtl' ? 'المترجم الذكي' : 'AI Translator'}</span>
            </div>
            <p className={`text-[11px] truncate ${activeLabStation === 'translator' ? 'text-blue-100' : 'text-slate-400'}`}>
              {dir === 'rtl' ? 'ترجمة الردود فوراً' : 'Instant Two-Way Sync'}
            </p>
          </button>
        </div>

        {/* Interactive Playground Surface */}
        <div className="max-w-4xl mx-auto bg-white dark:bg-slate-850 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-2xl transition-all">
          {/* STATION 1: LASER SCANNER */}
          {activeLabStation === 'scanner' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <UploadCloud className="w-5 h-5 text-brand-600" />
                    <span>{dir === 'rtl' ? 'محاكي الفحص والاستخراج بالليزر' : 'Exhibition Catalog Laser OCR Scanner'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {dir === 'rtl'
                      ? 'انقر على "بدء المسح بالليزر" وشاهد المحرك يقرأ الكتالوج ويستخرج الشركات والمستلمين الموثقين لحظياً.'
                      : 'Click "Run Laser Scan" to watch our engine parse complex exhibition directories and extract verified leads.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={runLaserScan}
                    disabled={isScanning}
                    className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <Zap className={`w-3.5 h-3.5 ${isScanning ? 'animate-bounce text-amber-300' : ''}`} />
                    <span>{isScanning ? (dir === 'rtl' ? 'جاري المسح...' : 'Scanning...') : (dir === 'rtl' ? 'بدء المسح بالليزر' : 'Run Laser Scan')}</span>
                  </button>
                </div>
              </div>

              {/* Simulated Document Preview with Laser Scan Effect */}
              <div className="relative rounded-2xl border border-slate-250 dark:border-slate-750 bg-slate-900 p-5 overflow-hidden text-slate-200">
                {isScanning && (
                  <motion.div
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] z-20 pointer-events-none"
                  />
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-400 border-b border-slate-800 pb-3 mb-3">
                  <span className="font-mono text-emerald-400 truncate">PDF: Cairo_Tech_Expo_2026.pdf (14.2 MB)</span>
                  <span className="font-bold text-white shrink-0">
                    {scannedItemsCount} / 71 {dir === 'rtl' ? 'شركة مستخرجة' : 'Companies Found'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Delta Industrial Systems</div>
                      <div className="text-slate-400 text-[11px] font-mono">info@delta-systems.eg</div>
                    </div>
                    <Badge variant="success" size="sm">Valid Email</Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Al-Ahram Packaging Co.</div>
                      <div className="text-slate-400 text-[11px] font-mono">contact@ahrampack.com</div>
                    </div>
                    <Badge variant="success" size="sm">Valid Email</Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Arabian Chemical Tech</div>
                      <div className="text-slate-400 text-[11px] font-mono">partnerships@arabchem.org</div>
                    </div>
                    <Badge variant="success" size="sm">Valid Email</Badge>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Nile Software Solutions</div>
                      <div className="text-slate-400 text-[11px] font-mono">sales@nilesoft.net</div>
                    </div>
                    <Badge variant="success" size="sm">Valid Email</Badge>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400">
                  <span className="truncate">✓ Layer Deduplication: 0 duplicate contacts saved</span>
                  <span className="text-emerald-400 font-semibold font-mono shrink-0">OCR Engine: Ready in 1.4s</span>
                </div>
              </div>
            </div>
          )}

          {/* STATION 2: SPAM RADAR */}
          {activeLabStation === 'spamRadar' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    <span>{dir === 'rtl' ? 'رادار كشف السبام وإعادة الصياغة بـ Gemini AI' : 'Gemini AI Spam Radar & Live Rewriter'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {dir === 'rtl'
                      ? 'بدّل بين الصياغة الترويجية الخطرة والصياغة المحسنة بالذكاء الاصطناعي وشاهد تأثيرها على مؤشر وصول الإيميل.'
                      : 'Toggle between risky promotional wording and Gemini AI auto-polish to see the real-time deliverability score jump.'}
                  </p>
                </div>

                {/* Toggle Chips */}
                <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
                  <button
                    onClick={() => setSpamFilterMode('risky')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-center transition-all ${
                      spamFilterMode === 'risky'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {dir === 'rtl' ? '⚠️ قبل التحسين' : '⚠️ Risky Copy'}
                  </button>
                  <button
                    onClick={() => setSpamFilterMode('polished')}
                    className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold text-center transition-all ${
                      spamFilterMode === 'polished'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {dir === 'rtl' ? '✨ بعد تحسين Gemini' : '✨ Gemini AI Polished'}
                  </button>
                </div>
              </div>

              {/* Score Meter & Visual Result */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
                {/* Gauge Card */}
                <div className="sm:col-span-4 p-5 rounded-2xl border text-center flex flex-col items-center justify-center space-y-2 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                  <div className="text-xs font-bold text-slate-500">
                    {dir === 'rtl' ? 'مؤشر الوصول للبريد الأساسي' : 'Inbox Deliverability'}
                  </div>
                  <div className={`text-4xl font-black font-mono transition-colors ${
                    spamFilterMode === 'polished' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {spamFilterMode === 'polished' ? '98 / 100' : '28 / 100'}
                  </div>
                  <Badge variant={spamFilterMode === 'polished' ? 'success' : 'destructive'} size="sm">
                    {spamFilterMode === 'polished'
                      ? (dir === 'rtl' ? 'آمن – وصول مضمون للـ Inbox' : 'Guaranteed Primary Inbox')
                      : (dir === 'rtl' ? 'خطر – تحويل تلقائي للسبام' : 'High Risk - Spam Folder Trap')}
                  </Badge>
                </div>

                {/* Subject & Body Preview */}
                <div className="sm:col-span-8 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                  <div className="text-xs">
                    <span className="font-semibold text-slate-400 block mb-1">Email Subject:</span>
                    <div
                      dir="ltr"
                      className={`font-mono text-xs p-2.5 rounded-xl border text-left ${
                      spamFilterMode === 'polished'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300 font-bold'
                        : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300 font-bold line-through'
                    }`}>
                      {spamFilterMode === 'polished'
                        ? 'Partnership Inquiry: Expanding B2B Distribution with {{company_name}}'
                        : 'FREE OFFER 100% CHEAP!!! CLICK HERE NOW TO BUY CHEAPEST PRODUCTS URGENT!'}
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="font-semibold text-slate-400 block mb-1">Body Preview:</span>
                    <div dir="ltr" className="p-3 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs leading-relaxed text-left">
                      {spamFilterMode === 'polished' ? (
                        <p>
                          Hi <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">&#123;&#123;person_name&#125;&#125;</span>,<br />
                          I noticed your booth at the Cairo Tech Exhibition. Given your work at <span className="text-emerald-600 dark:text-emerald-400 font-semibold font-mono">&#123;&#123;company_name&#125;&#125;</span>, I'd love to share our technical catalogue regarding your engineering operations.
                        </p>
                      ) : (
                        <p className="text-rose-700 dark:text-rose-400">
                          DEAR SIR WE HAVE THE CHEAPEST OFFER CLICK THIS LINK NOW TO GET 90% DISCOUNT AND WIN BIG MONEY DO NOT MISS THIS URGENT DEAL!
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STATION 3: ANTI-BAN TIME ENGINE */}
          {activeLabStation === 'antiBan' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span>{dir === 'rtl' ? 'محاكي الإرسال البشري وقاطع الدائرة الذكي' : 'Anti-Ban Humanized Queue & Circuit Breaker'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {dir === 'rtl'
                      ? 'مقارنة حية بين الإرسال العشوائي الذي يؤدي لحظر الحساب خلال دقائق وبين طابور ReachCraft المحمي.'
                      : 'Live comparison: see how human randomized pacing (20-35s) keeps your Gmail 100% active and ban-free.'}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setIsQueueRunning(true);
                    setTimeout(() => setIsQueueRunning(false), 2000);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{isQueueRunning ? (dir === 'rtl' ? 'جاري المحاكاة...' : 'Simulating...') : (dir === 'rtl' ? 'تشغيل محاكاة الطابور' : 'Trigger Queue Simulation')}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Blaster Failure Card */}
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-250 dark:border-rose-900/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-700 dark:text-rose-400">
                      {dir === 'rtl' ? 'برامج الإرسال العشوائي (Bulk Blaster)' : 'Traditional Blast Tool'}
                    </span>
                    <Badge variant="destructive" size="sm">Banned</Badge>
                  </div>
                  <div dir="ltr" className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono text-left">
                    <div>00:00:01 → Sent 50 messages in 1s</div>
                    <div className="text-rose-600 font-bold">00:00:03 → Google Error 429 (Rate Limit)</div>
                    <div className="text-rose-600 font-bold">00:00:05 → Account Suspended for Spam</div>
                  </div>
                </div>

                {/* ReachCraft Smart Queue Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                      {dir === 'rtl' ? 'محرك ReachCraft الذكي' : 'ReachCraft Pacing Engine'}
                    </span>
                    <Badge variant="success" size="sm">Active (0% Risk)</Badge>
                  </div>
                  <div dir="ltr" className="text-xs text-slate-600 dark:text-slate-300 space-y-1 font-mono text-left">
                    <div className="text-emerald-600 font-semibold">00:00:00 → Recipient 1 dispatched (200 OK)</div>
                    <div className="text-slate-400">00:00:24 → Human jitter wait (random 24.2s delay)</div>
                    <div className="text-emerald-600 font-semibold">00:00:25 → Recipient 2 dispatched (200 OK)</div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>⚡ Circuit Breaker Status: Armed (Immediate auto-pause on bounce threshold)</span>
                <span className="text-emerald-600 font-bold font-mono shrink-0">100% Free Stack Safety</span>
              </div>
            </div>
          )}

          {/* STATION 4: MULTILINGUAL AI TRANSLATOR */}
          {activeLabStation === 'translator' && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-blue-600" />
                    <span>{dir === 'rtl' ? 'البريد الوارد الذكي والترجمة الفورية بـ Gemini' : 'Two-Way AI Inbox & Instant Translation'}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    {dir === 'rtl'
                      ? 'انقر على زر الترجمة لمشاهدة تحويل الردود الواردة من الشركات العالمية إلى اللغة العربية الفصحى فورياً.'
                      : 'Click "Translate Message" to watch foreign company replies translated into fluent Arabic or English with one click.'}
                  </p>
                </div>

                <button
                  onClick={() => setIsTranslated(!isTranslated)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>{isTranslated ? (dir === 'rtl' ? 'عرض النص الإنجليزي الأصلي' : 'Show Original English') : (dir === 'rtl' ? 'ترجمة إلى العربية بـ Gemini' : 'Translate to Arabic')}</span>
                </button>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-2">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center font-bold shrink-0">
                      JD
                    </div>
                    <div dir="ltr" className="text-left min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white font-mono truncate">John Davis &lt;j.davis@innovatetech.com&gt;</div>
                      <div className="text-[11px] text-slate-400 truncate">Subject: Re: Partnership Inquiry from Cairo Tech Fair</div>
                    </div>
                  </div>
                  <Badge variant="brand" size="sm">Live Reply</Badge>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850 text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                  {isTranslated ? (
                    <p dir="rtl" className="font-semibold text-emerald-800 dark:text-emerald-300 text-right leading-relaxed">
                      «مرحباً، شكراً لتواصلكم معنا بعد المعرض التقني. لقد راجعنا ملف شركتكم ونود فعلاً عقد اجتماع عبر الإنترنت لمناقشة فرص التعاون وتوريد البرمجيات. هل يناسبكم الأربعاء القادم؟ مع أطيب التحيات، جون ديفيس.»
                    </p>
                  ) : (
                    <p dir="ltr" className="text-left font-mono text-xs text-slate-600 dark:text-slate-300">
                      "Hello, thank you for reaching out after the tech exhibition. We reviewed your catalog and would love to schedule a video call next week to discuss potential software distribution and cooperation. Would next Wednesday work for your team? Best regards, John Davis."
                    </p>
                  )}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px] text-slate-400">
                  <span>✓ Real-time two-way sync with Gmail inbox</span>
                  <span className="text-blue-500 font-semibold">Gemini 1.5 Pro Neural Translation</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

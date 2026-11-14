import React, { useState } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  UploadCloud,
  FileCheck2,
  Users2,
  FileCode2,
  Send,
  ScrollText,
  Settings,
  LogOut,
  Sparkles,
  Globe,
  Inbox,
  Crown,
  ChevronDown,
  BarChart3,
  Users,
  CreditCard,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from '../../i18n/LanguageContext';

interface SidebarProps {
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onCloseMobile }) => {
  const { user, logout, isSuperAdmin } = useAuth();
  const { t, language, toggleLanguage, dir } = useTranslation();
  const location = useLocation();

  const isAr = dir === 'rtl';
  const isAdminActive = location.pathname.startsWith('/admin');
  const [isAdminExpanded, setIsAdminExpanded] = useState<boolean>(isAdminActive || true);

  const adminSubItems = [
    { tab: 'overview', label: isAr ? 'نظرة عامة ومراقبة' : 'Overview & KPIs', icon: BarChart3 },
    { tab: 'users', label: isAr ? 'إدارة المستخدمين' : 'User Accounts', icon: Users },
    { tab: 'plans', label: isAr ? 'الباقات والحدود' : 'Plans & Quotas', icon: CreditCard },
    { tab: 'templates', label: isAr ? 'القوالب الافتراضية' : 'Default Templates', icon: FileCode2 },
    { tab: 'verified', label: isAr ? 'قاعدة الاتصال الموثقة' : 'Verified B2B Leads', icon: ShieldCheck },
    { tab: 'logs', label: isAr ? 'سجل تدقيق المنصة' : 'Platform Audit Log', icon: ScrollText },
  ];

  const currentTab = new URLSearchParams(location.search).get('tab') || 'overview';

  const navItems = [
    { to: '/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
    { to: '/', label: t('nav.landing'), icon: Sparkles },
    { to: '/inbox', label: t('nav.inbox'), icon: Inbox, badge: 'AI' },
    { to: '/upload', label: t('nav.upload'), icon: UploadCloud },
    { to: '/review', label: t('nav.review'), icon: FileCheck2 },
    { to: '/contacts', label: t('nav.contacts'), icon: Users2 },
    { to: '/templates', label: t('nav.templates'), icon: FileCode2 },
    { to: '/campaigns', label: t('nav.campaigns'), icon: Send },
    { to: '/logs', label: t('nav.logs'), icon: ScrollText },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside
      className={`w-64 bg-white dark:bg-slate-900 ${
        dir === 'rtl' ? 'border-l' : 'border-r'
      } border-slate-200/80 dark:border-slate-800 flex flex-col h-full shrink-0`}
    >
      {/* Brand Header */}
      <Link
        to="/dashboard"
        onClick={() => onCloseMobile?.()}
        className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 p-1 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/80 shadow-xs shrink-0">
          <img src="/logo.png" alt="ReachCraft" className="w-full h-full object-contain" />
        </div>
        <div className="truncate">
          <h1 className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            {t('common.appName')}
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300">
              {t('common.freeBadge')}
            </span>
          </h1>
          <p className="text-xs text-slate-500 truncate">Outreach Studio</p>
        </div>
      </Link>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Main Dashboard */}
        <NavLink
          to="/dashboard"
          onClick={() => onCloseMobile?.()}
          className={({ isActive }) =>
            `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors select-none ${
              isActive
                ? 'text-brand-700 dark:text-brand-300 font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
            }`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId={onCloseMobile ? 'activeMobileSidebarPill' : 'activeDesktopSidebarPill'}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  className="absolute inset-0 bg-brand-50 dark:bg-brand-950/60 rounded-xl -z-10 border border-brand-200/60 dark:border-brand-800/60 shadow-xs"
                />
              )}
              <LayoutDashboard
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
                }`}
              />
              <span className="flex-1 truncate">{t('nav.dashboard')}</span>
            </>
          )}
        </NavLink>

        {/* Super Admin Expandable Dropdown */}
        {isSuperAdmin && (
          <div className="rounded-xl overflow-hidden bg-slate-50/70 dark:bg-slate-850/50 border border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={() => setIsAdminExpanded(!isAdminExpanded)}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-semibold transition-colors ${
                isAdminActive
                  ? 'text-purple-700 dark:text-purple-300'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Crown className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <span className="truncate">{isAr ? 'لوحة تحكم الإدارة' : 'Super Admin'}</span>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-purple-600 text-white">
                  PRO
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                  isAdminExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence initial={false}>
              {isAdminExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-0.5 px-2 pb-2 pt-0.5"
                >
                  {adminSubItems.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = isAdminActive && currentTab === sub.tab;
                    return (
                      <Link
                        key={sub.tab}
                        to={`/admin?tab=${sub.tab}`}
                        onClick={() => onCloseMobile?.()}
                        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          isSubActive
                            ? 'bg-purple-600 text-white shadow-xs font-semibold'
                            : 'text-slate-600 dark:text-slate-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50/70 dark:hover:bg-purple-950/40'
                        }`}
                      >
                        <SubIcon className={`w-3.5 h-3.5 shrink-0 ${isSubActive ? 'text-white' : 'text-slate-400'}`} />
                        <span className="truncate">{sub.label}</span>
                      </Link>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Other Regular Nav Items */}
        {navItems.slice(1).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => onCloseMobile?.()}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors select-none ${
                  isActive
                    ? 'text-brand-700 dark:text-brand-300 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/60'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId={onCloseMobile ? 'activeMobileSidebarPill' : 'activeDesktopSidebarPill'}
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 bg-brand-50 dark:bg-brand-950/60 rounded-xl -z-10 border border-brand-200/60 dark:border-brand-800/60 shadow-xs"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-gradient-to-r from-purple-500 to-brand-500 text-white shadow-xs">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Area: Language & Guarantee & User */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {/* Language Switch Button in Sidebar */}
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all border border-slate-200/50 dark:border-slate-700/50"
        >
          <span className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
            <span>{t('common.language')}</span>
          </span>
          <span className="px-2 py-0.5 rounded-md bg-white dark:bg-slate-700 text-[11px] font-bold text-brand-700 dark:text-brand-300 shadow-xs">
            {language === 'ar' ? 'العربية' : 'English'}
          </span>
        </button>

        {/* Free Stack Guarantee Pill */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>{t('common.freeStackActive')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              {t('common.freeGuarantee')}
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
            <div className="bg-brand-500 h-full w-full rounded-full" />
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5">{t('common.noPaidApi')}</p>
        </div>

        {/* User Info */}
        <div className="flex items-center justify-between px-2">
          <div className="truncate pr-2">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
              {user?.email || 'Admin'}
            </p>
            <p className="text-[11px] text-slate-500">{t('common.admin')}</p>
          </div>
          <button
            onClick={() => {
              onCloseMobile?.();
              logout();
            }}
            title={t('nav.logout')}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};

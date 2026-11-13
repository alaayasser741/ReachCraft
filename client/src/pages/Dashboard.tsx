import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Mail,
  MessageSquare,
  Send,
  UploadCloud,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Shield,
  FileCheck2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, type Variants } from 'framer-motion';
import { api } from '../services/api';
import { Campaign, AppSettings } from '../types';

export const Dashboard: React.FC = () => {
  const { t, dir } = useTranslation();

  const [stats, setStats] = useState({
    totalCompanies: 0,
    withEmail: 0,
    withWhatsApp: 0,
    emailToday: 0,
    emailCap: 100,
    waToday: 0,
    waCap: 30,
  });
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.getCompanies(),
      api.getContacts(),
      api.getCampaigns(),
      api.getLogStats(),
      api.getSettings(),
    ])
      .then(([compRes, contRes, campRes, logRes, setRes]) => {
        const emailContacts = contRes.contacts.filter((c) => c.email && c.is_valid_email).length;
        const waContacts = contRes.contacts.filter((c) => c.whatsapp_number && c.is_valid_whatsapp).length;

        setStats({
          totalCompanies: compRes.companies.length,
          withEmail: emailContacts,
          withWhatsApp: waContacts,
          emailToday: logRes.stats.emailToday || 0,
          emailCap: setRes.settings.email_daily_cap || 100,
          waToday: logRes.stats.waToday || 0,
          waCap: setRes.settings.whatsapp_daily_cap || 30,
        });

        setCampaigns(campRes.campaigns.slice(0, 5));
        setSettings(setRes.settings);
      })
      .catch((err) => console.error('Dashboard load failed:', err))
      .finally(() => setIsLoading(false));
  }, []);

  const emailCapPercent = Math.min(100, Math.round((stats.emailToday / stats.emailCap) * 100));

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.07 },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: 'easeOut' } },
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto" dir={dir}>
      {/* Top Banner: Welcome & Quick Launch */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-brand-900 via-slate-900 to-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-xl shadow-brand-950/20 border border-brand-800/40"
      >
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 text-xs font-semibold mb-3 border border-brand-500/30">
            <Shield className="w-3.5 h-3.5" />
            <span>{t('dashboard.safeguardsBadge')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            {t('dashboard.bannerTitle')}
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            {t('dashboard.bannerSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link to="/upload">
            <Button variant="secondary" size="md" leftIcon={<UploadCloud className="w-4 h-4" />}>
              {t('dashboard.uploadCatalog')}
            </Button>
          </Link>
          <Link to="/campaigns?action=new">
            <Button
              className="bg-brand-500 hover:bg-brand-600 text-white"
              size="md"
              leftIcon={<Send className="w-4 h-4" />}
            >
              {t('dashboard.startCampaign')}
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* 4 Hero KPI Cards */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      >
        <motion.div variants={itemVariants}>
          <Card className="p-5" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.totalCompanies')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {isLoading ? '...' : stats.totalCompanies}
            </p>
            <p className="text-xs text-slate-400 mt-1">{t('dashboard.totalCompaniesDesc')}</p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.verifiedEmails')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-brand-50 dark:bg-brand-950/50 text-brand-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {isLoading ? '...' : stats.withEmail}
            </p>
            <p className="text-xs text-brand-600 dark:text-brand-400 mt-1 font-medium">
              {t('dashboard.verifiedEmailsDesc')}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.whatsappCandidates')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-3">
              {isLoading ? '...' : stats.withWhatsApp}
            </p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 font-medium">
              {t('dashboard.whatsappCandidatesDesc')}
            </p>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="p-5" hoverEffect>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {t('dashboard.dailyQuota')}
              </span>
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {stats.emailToday}
              </span>
              <span className="text-sm text-slate-400">
                / {stats.emailCap} {t('dashboard.emailsUnit')}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${emailCapPercent}%` }}
              />
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Two Column Section: Channel Health & Recent Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Delivery Channels Status (1 Col) */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-600" />
              <span>{t('dashboard.outreachProviders')}</span>
            </h3>

            <div className="space-y-4">
              {/* Email Provider Pill */}
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-brand-600" />
                    <span>{t('dashboard.nodemailerGmail')}</span>
                  </span>
                  <Badge variant="success" size="sm">
                    {t('common.active')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {t('dashboard.emailSafeguardsDesc', { cap: stats.emailCap })}
                </p>
              </div>

              {/* WhatsApp Provider Pill */}
              <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>{t('dashboard.whatsAppMode')}</span>
                  </span>
                  <Badge variant="brand" size="sm">
                    {settings?.whatsapp_provider === 'click-to-chat'
                      ? 'Click-to-chat'
                      : 'Session'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">
                  {settings?.whatsapp_provider === 'click-to-chat'
                    ? t('dashboard.whatsAppClickToChatDesc')
                    : t('dashboard.whatsAppSessionDesc')}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Link
                to="/settings"
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
              >
                <span>{t('dashboard.manageSettings')}</span>
                <ArrowUpRight className={`w-3.5 h-3.5 ${dir === 'rtl' ? 'rotate-90' : ''}`} />
              </Link>
            </div>
          </Card>

          {/* Quick Shortcuts */}
          <Card className="p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              {t('dashboard.quickNavigation')}
            </h3>
            <div className="space-y-2">
              <Link
                to="/upload"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-200"
              >
                <span className="flex items-center gap-2.5">
                  <UploadCloud className="w-4 h-4 text-brand-600" />
                  <span>{t('dashboard.uploadExhibitionPdf')}</span>
                </span>
                <ArrowUpRight className={`w-4 h-4 text-slate-400 ${dir === 'rtl' ? 'rotate-90' : ''}`} />
              </Link>

              <Link
                to="/review"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-200"
              >
                <span className="flex items-center gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  <span>{t('dashboard.reviewStagedData')}</span>
                </span>
                <ArrowUpRight className={`w-4 h-4 text-slate-400 ${dir === 'rtl' ? 'rotate-90' : ''}`} />
              </Link>

              <Link
                to="/contacts"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm text-slate-700 dark:text-slate-200"
              >
                <span className="flex items-center gap-2.5">
                  <Building2 className="w-4 h-4 text-purple-600" />
                  <span>{t('dashboard.companiesDirectory')}</span>
                </span>
                <ArrowUpRight className={`w-4 h-4 text-slate-400 ${dir === 'rtl' ? 'rotate-90' : ''}`} />
              </Link>
            </div>
          </Card>
        </div>

        {/* Right Column: Campaigns Pipeline (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('dashboard.activeCampaigns')}
                </h3>
                <p className="text-xs text-slate-500">{t('dashboard.liveProgress')}</p>
              </div>
              <Link to="/campaigns">
                <Button variant="ghost" size="sm">
                  {t('dashboard.viewAll')}
                </Button>
              </Link>
            </div>

            {campaigns.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <Send className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {t('dashboard.noCampaignsTitle')}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                  {t('dashboard.noCampaignsDesc')}
                </p>
                <Link to="/campaigns?action=new">
                  <Button size="sm" variant="primary">
                    {t('dashboard.createFirstCampaign')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {campaigns.map((camp) => {
                  const percent =
                    camp.total_recipients > 0
                      ? Math.round((camp.sent_count / camp.total_recipients) * 100)
                      : 0;

                  return (
                    <div
                      key={camp.id}
                      className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Link
                            to={`/campaigns/${camp.id}`}
                            className="text-sm font-bold text-slate-900 dark:text-white hover:text-brand-600 transition-colors"
                          >
                            {camp.name}
                          </Link>
                          {camp.is_dry_run === 1 && (
                            <Badge variant="purple" size="sm">
                              {t('dashboard.dryRun')}
                            </Badge>
                          )}
                          <Badge
                            variant={
                              camp.status === 'running'
                                ? 'brand'
                                : camp.status === 'done'
                                ? 'success'
                                : camp.status === 'paused'
                                ? 'warning'
                                : 'slate'
                            }
                            size="sm"
                          >
                            {camp.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="capitalize">{camp.channel}</span>
                          <span>•</span>
                          <span>{t('dashboard.recipientsCount', { count: camp.total_recipients })}</span>
                          <span>•</span>
                          <span>
                            {t('dashboard.sentFailedRatio', {
                              sent: camp.sent_count,
                              failed: camp.failed_count,
                            })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-48">
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-brand-500 h-full rounded-full"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-9 text-right font-mono">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

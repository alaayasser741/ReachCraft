import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Building2,
  Users2,
  Mail,
  MessageSquare,
  Search,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  ShieldAlert,
  ShieldCheck,
  X,
  Send,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { Pagination } from '../components/ui/Pagination';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { Company, Contact } from '../types';

export const CompaniesContacts: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const activeTab = (searchParams.get('tab') as 'contacts' | 'companies' | 'verified_pool') || 'contacts';
  const pageParam = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSizeParam = [10, 25, 50, 100].includes(Number(searchParams.get('pageSize')))
    ? Number(searchParams.get('pageSize'))
    : 25;
  const filterParam = (searchParams.get('filter') as 'all' | 'email' | 'whatsapp' | 'optedOut') || 'all';
  const urlSearch = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Stats
  const [stats, setStats] = useState({
    totalContacts: 0,
    verifiedEmails: 0,
    validWhatsApp: 0,
    optedOut: 0,
    totalCompanies: 0,
    poolCount: 0,
  });

  // Selected for drawer
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Sync input when URL param changes externally
  useEffect(() => {
    setSearchInput(urlSearch);
    setDebouncedSearch(urlSearch);
  }, [urlSearch]);

  // Debounce search input (350ms) and sync to URL
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      if (searchInput !== urlSearch) {
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (searchInput.trim()) {
              next.set('search', searchInput.trim());
            } else {
              next.delete('search');
            }
            next.set('page', '1');
            return next;
          },
          { replace: true }
        );
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadStats = async () => {
    try {
      const res = await api.getContactStats();
      if (res.success && res.stats) {
        setStats({
          ...res.stats,
          poolCount: res.stats.poolCount || 0,
        });
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'contacts' || activeTab === 'verified_pool') {
        const res = await api.getContacts({
          pool: activeTab === 'verified_pool',
          search: debouncedSearch || undefined,
          hasEmail: filterParam === 'email' ? true : undefined,
          hasWhatsApp: filterParam === 'whatsapp' ? true : undefined,
          optedOut: filterParam === 'optedOut' ? true : undefined,
          page: pageParam,
          limit: pageSizeParam,
        });
        setContacts(res.contacts);
        const total = res.total ?? res.count ?? 0;
        setTotalItems(total);
        setTotalPages(res.totalPages ?? (Math.ceil(total / pageSizeParam) || 1));
      } else {
        const res = await api.getCompanies({
          search: debouncedSearch || undefined,
          page: pageParam,
          limit: pageSizeParam,
        });
        setCompanies(res.companies);
        const total = res.total ?? res.count ?? 0;
        setTotalItems(total);
        setTotalPages(res.totalPages ?? (Math.ceil(total / pageSizeParam) || 1));
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, debouncedSearch, filterParam, pageParam, pageSizeParam]);

  useEffect(() => {
    loadStats();
  }, []);

  const handleTabChange = (newTab: 'contacts' | 'companies' | 'verified_pool') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('tab', newTab);
      next.set('page', '1');
      return next;
    });
  };

  const handleFilterChange = (newFilter: 'all' | 'email' | 'whatsapp' | 'optedOut') => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (newFilter === 'all') {
        next.delete('filter');
      } else {
        next.set('filter', newFilter);
      }
      next.set('page', '1');
      return next;
    });
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(newPage));
      return next;
    });
  };

  const handlePageSizeChange = (newSize: number) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('pageSize', String(newSize));
      next.set('page', '1');
      return next;
    });
  };

  const handleUpdateContact = async () => {
    if (!selectedContact) return;
    try {
      await api.updateContact(selectedContact.id, {
        person_name: selectedContact.person_name,
        job_title: selectedContact.job_title,
        email: selectedContact.email,
        phone_mobile: selectedContact.phone_mobile,
        whatsapp_number: selectedContact.whatsapp_number,
        opted_out: selectedContact.opted_out,
        notes: selectedContact.notes,
      });
      toastSuccess('Contact updated successfully');
      setSelectedContact(null);
      loadData();
      loadStats();
    } catch (err: any) {
      toastError(err.message || 'Update failed');
    }
  };

  const handleDeleteContact = async (id: number) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await api.deleteContact(id);
      toastSuccess('Contact removed');
      loadData();
      loadStats();
    } catch (err: any) {
      toastError(err.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-fade-in" dir={dir}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {t('contacts.title')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">{t('contacts.subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <a href={api.exportContactsCsvUrl()} download="reachcraft_contacts.csv">
            <Button variant="outline" size="md" leftIcon={<Download className="w-4 h-4" />}>
              {t('contacts.exportCsv')}
            </Button>
          </a>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Total Contacts */}
        <Card className="p-3.5 flex items-center gap-3 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
            <Users2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {t('contacts.statTotalContacts')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.totalContacts}
            </div>
          </div>
        </Card>

        {/* Verified Emails */}
        <Card className="p-3.5 flex items-center gap-3 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {t('contacts.statVerifiedEmails')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.verifiedEmails}
            </div>
          </div>
        </Card>

        {/* Valid WhatsApp */}
        <Card className="p-3.5 flex items-center gap-3 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
          <div className="p-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 shrink-0">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {t('contacts.statValidWhatsApp')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.validWhatsApp}
            </div>
          </div>
        </Card>

        {/* Opted Out */}
        <Card className="p-3.5 flex items-center gap-3 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {t('contacts.statOptedOut')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.optedOut}
            </div>
          </div>
        </Card>

        {/* Total Companies */}
        <Card className="p-3.5 flex items-center gap-3 border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 shadow-xs col-span-2 sm:col-span-1">
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-medium text-slate-500 truncate">
              {t('contacts.statTotalCompanies')}
            </div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-0.5">
              {stats.totalCompanies}
            </div>
          </div>
        </Card>

        {/* Verified Leads Pool */}
        <Card
          onClick={() => handleTabChange('verified_pool' as any)}
          className="p-3.5 flex items-center gap-3 border-purple-200/80 dark:border-purple-800/80 bg-purple-50/50 dark:bg-purple-950/30 shadow-xs col-span-2 sm:col-span-1 cursor-pointer hover:border-purple-400 transition-all"
        >
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-purple-600 dark:text-purple-400 truncate">
              {dir === 'rtl' ? 'قاعدة البيانات الموثقة' : 'Verified Pool'}
            </div>
            <div className="text-xl font-extrabold text-purple-700 dark:text-purple-300 mt-0.5">
              {stats.poolCount || 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs & Search Filter Card */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Main Switcher Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => handleTabChange('contacts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>{t('contacts.contactsView')}</span>
            </button>
            <button
              onClick={() => handleTabChange('companies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'companies'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('contacts.companiesView')}</span>
            </button>
            <button
              onClick={() => handleTabChange('verified_pool' as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'verified_pool'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{dir === 'rtl' ? 'قاعدة جهات الاتصال الموثقة' : 'Verified B2B Leads'}</span>
              {stats.poolCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 text-white font-extrabold">
                  {stats.poolCount}
                </span>
              )}
            </button>
          </div>

          {/* Debounced Search Box synced to URL */}
          <div className="relative w-full sm:w-80">
            <Search
              className={`w-4 h-4 text-slate-400 absolute ${
                dir === 'rtl' ? 'right-3' : 'left-3'
              } top-1/2 -translate-y-1/2 pointer-events-none`}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={
                activeTab === 'companies'
                  ? t('contacts.searchPlaceholderCompanies')
                  : activeTab === 'verified_pool'
                  ? (dir === 'rtl' ? 'بحث في جهات الاتصال الموثقة بالاسم، البريد، الشركة...' : 'Search verified leads by name, email, company...')
                  : t('contacts.searchPlaceholderContacts')
              }
              className={`w-full ${
                dir === 'rtl' ? 'pr-9 pl-9' : 'pl-9 pr-9'
              } py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all`}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className={`absolute ${
                  dir === 'rtl' ? 'left-3' : 'right-3'
                } top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Contacts Filter Pills (Visible in contacts tab and verified pool) */}
        {(activeTab === 'contacts' || activeTab === 'verified_pool') && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[11px] mr-1">
              {t('common.status')}:
            </span>
            <button
              onClick={() => handleFilterChange('all')}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                filterParam === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t('contacts.allContacts')}
            </button>
            <button
              onClick={() => handleFilterChange(filterParam === 'email' ? 'all' : 'email')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                filterParam === 'email'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>{t('contacts.hasEmailFilter')}</span>
            </button>
            <button
              onClick={() => handleFilterChange(filterParam === 'whatsapp' ? 'all' : 'whatsapp')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                filterParam === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{t('contacts.hasWhatsAppFilter')}</span>
            </button>
            <button
              onClick={() => handleFilterChange(filterParam === 'optedOut' ? 'all' : 'optedOut')}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                filterParam === 'optedOut'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{t('contacts.optedOutFilter')}</span>
            </button>
          </div>
        )}
      </Card>

      {/* Verified Pool Info Banner */}
      {activeTab === 'verified_pool' && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/70 rounded-2xl text-purple-950 dark:text-purple-200 text-xs shadow-xs animate-fade-in">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="flex-1 leading-relaxed">
            <span className="font-extrabold text-sm block mb-0.5">
              {dir === 'rtl' ? 'قاعدة جهات الاتصال الموثقة (Verified B2B Pool)' : 'Verified B2B Leads Pool'}
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              {dir === 'rtl'
                ? 'جهات اتصال B2B رسمية ومتحقق من صحة بريدها الإلكتروني وأرقامها، أضافتها إدارة ReachCraft لتمكينك من إطلاق حملاتك المباشرة بدون الحاجة لرفع قوائم خارجية.'
                : 'Pre-verified B2B leads validated by ReachCraft admins with checked emails and phones. You can launch outreach directly without uploading external lists.'}
            </span>
          </div>
        </div>
      )}

      {/* Main Content Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-2">{t('common.loading')}</p>
        </div>
      ) : (activeTab === 'contacts' || activeTab === 'verified_pool') ? (
        /* Contacts Table (Both Personal and Verified Pool) */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('contacts.colPerson')}</th>
                  <th className="py-3 px-4">{t('contacts.colCompany')}</th>
                  <th className="py-3 px-4">{t('contacts.colEmail')}</th>
                  <th className="py-3 px-4">{t('contacts.colPhone')}</th>
                  <th className="py-3 px-4">{activeTab === 'verified_pool' ? (dir === 'rtl' ? 'حالة التوثيق' : 'Verification') : t('contacts.colConsent')}</th>
                  <th className="py-3 px-4 text-right rtl:text-left">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      {activeTab === 'verified_pool'
                        ? (dir === 'rtl' ? 'لا توجد جهات اتصال موثقة مطابقة للبحث' : 'No verified leads found matching your search')
                        : t('contacts.noContactsMatch')}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {contact.person_name || <span className="text-slate-400 font-normal italic">Unknown</span>}
                          </span>
                          {contact.is_verified_pool === 1 && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                              <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              <span>{dir === 'rtl' ? 'موثق' : 'Verified'}</span>
                            </span>
                          )}
                        </div>
                        {contact.job_title && (
                          <div className="text-[11px] text-slate-400 mt-0.5">{contact.job_title}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700 dark:text-slate-300 font-semibold">
                        {contact.company_name}
                      </td>
                      <td className="py-3 px-4">
                        {contact.email ? (
                          <div className="flex items-center gap-1.5 font-mono text-[11px]" dir="ltr">
                            <span className="text-slate-800 dark:text-slate-200">{contact.email}</span>
                            {contact.is_valid_email === 1 ? (
                              <Badge variant="success" size="sm">Valid</Badge>
                            ) : (
                              <Badge variant="warning" size="sm">Unchecked</Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px]" dir="ltr">
                        {contact.whatsapp_number || contact.phone_mobile || (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {activeTab === 'verified_pool' ? (
                          <Badge variant="purple" size="sm" icon={<ShieldCheck className="w-3 h-3 text-purple-600" />}>
                            {dir === 'rtl' ? 'معتمد وموثق' : 'Verified Lead'}
                          </Badge>
                        ) : contact.opted_out === 1 ? (
                          <Badge variant="danger" size="sm">
                            {t('contacts.optedOut')}
                          </Badge>
                        ) : (
                          <Badge variant="success" size="sm">
                            {t('contacts.subscribed')}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          {activeTab === 'verified_pool' ? (
                            <>
                              <button
                                onClick={() => {
                                  navigate(`/campaigns?contactId=${contact.id}`);
                                }}
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors flex items-center gap-1.5 shadow-xs"
                                title={dir === 'rtl' ? 'إطلاق حملة تواصل مع هذه الجهة' : 'Create campaign for this lead'}
                              >
                                <Send className="w-3 h-3" />
                                <span>{dir === 'rtl' ? 'مراسلة' : 'Reach out'}</span>
                              </button>
                              {isSuperAdmin && (
                                <>
                                  <button
                                    onClick={() => setSelectedContact(contact)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    title={t('contacts.editContact')}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteContact(contact.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                    title={t('common.delete')}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setSelectedContact(contact)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title={t('contacts.editContact')}
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteContact(contact.id)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                                title={t('common.delete')}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSizeParam}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      ) : (
        /* Companies Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('review.colCompany')}</th>
                  <th className="py-3 px-4">{t('review.websiteLabel')}</th>
                  <th className="py-3 px-4">{t('contacts.colSpecialization')}</th>
                  <th className="py-3 px-4 text-center">{t('nav.contacts')}</th>
                  <th className="py-3 px-4">{t('contacts.colDirectContact')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {companies.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      {t('contacts.noCompaniesMatch')}
                    </td>
                  </tr>
                ) : (
                  companies.map((company) => (
                    <tr key={company.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {company.name}
                      </td>
                      <td className="py-3 px-4">
                        {company.website ? (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <span>{company.website.replace(/^https?:\/\//i, '')}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-slate-400 italic">{t('common.none')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {company.description || company.address || '-'}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {company.contact_count || 0}
                      </td>
                      <td className="py-3 px-4">
                        {company.has_direct_contact === 1 ? (
                          <Badge variant="success" size="sm">
                            {t('contacts.directChannel')}
                          </Badge>
                        ) : (
                          <Badge variant="slate" size="sm">
                            {t('contacts.partnerBoothOnly')}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            api.getCompany(company.id).then((res) => setSelectedCompany(res.company));
                          }}
                        >
                          {t('contacts.viewDossier')}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <Pagination
            currentPage={pageParam}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSizeParam}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
          />
        </Card>
      )}

      {/* Edit Contact Drawer */}
      {selectedContact && (
        <Drawer
          isOpen={Boolean(selectedContact)}
          onClose={() => setSelectedContact(null)}
          title={t('contacts.editContact')}
          subtitle={selectedContact.company_name}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts.fullName')}
              </label>
              <input
                type="text"
                value={selectedContact.person_name || ''}
                onChange={(e) =>
                  setSelectedContact({ ...selectedContact, person_name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts.jobTitle')}
              </label>
              <input
                type="text"
                value={selectedContact.job_title || ''}
                onChange={(e) =>
                  setSelectedContact({ ...selectedContact, job_title: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts.emailAddress')}
              </label>
              <input
                type="email"
                value={selectedContact.email || ''}
                onChange={(e) =>
                  setSelectedContact({ ...selectedContact, email: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts.mobileWhatsApp')}
              </label>
              <input
                type="text"
                value={selectedContact.phone_mobile || ''}
                onChange={(e) =>
                  setSelectedContact({
                    ...selectedContact,
                    phone_mobile: e.target.value,
                    whatsapp_number: e.target.value,
                  })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts.optOutStatus')}
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="optedOut"
                    checked={selectedContact.opted_out === 0}
                    onChange={() => setSelectedContact({ ...selectedContact, opted_out: 0 })}
                    className="text-brand-600 focus:ring-brand-500"
                  />
                  <span>{t('contacts.optOutActive')}</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="optedOut"
                    checked={selectedContact.opted_out === 1}
                    onChange={() => setSelectedContact({ ...selectedContact, opted_out: 1 })}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>{t('contacts.optOutExcluded')}</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('contacts.notes')}
              </label>
              <textarea
                rows={3}
                value={selectedContact.notes || ''}
                onChange={(e) =>
                  setSelectedContact({ ...selectedContact, notes: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="primary" className="w-full" onClick={handleUpdateContact}>
                {t('contacts.saveContactChanges')}
              </Button>
            </div>
          </div>
        </Drawer>
      )}

      {/* Company Dossier Drawer */}
      {selectedCompany && (
        <Drawer
          isOpen={Boolean(selectedCompany)}
          onClose={() => setSelectedCompany(null)}
          title={selectedCompany.name}
          subtitle={selectedCompany.website || t('common.none')}
        >
          <div className="space-y-6">
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {t('contacts.companyDetails')}
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200">
                {selectedCompany.description || t('common.none')}
              </p>
              {selectedCompany.address && (
                <p className="text-xs text-slate-500 mt-2">
                  <strong>{t('review.addressLabel')}:</strong> {selectedCompany.address}
                </p>
              )}
            </div>

            {/* Direct Contacts at this Company */}
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('contacts.associatedContacts')} ({selectedCompany.contacts?.length || 0})
              </h4>
              {selectedCompany.contacts && selectedCompany.contacts.length > 0 ? (
                <div className="space-y-2">
                  {selectedCompany.contacts.map((c) => (
                    <div
                      key={c.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1"
                    >
                      <div className="font-bold text-slate-900 dark:text-white">
                        {c.person_name || t('contacts.anonymousContact')}{' '}
                        {c.job_title && `(${c.job_title})`}
                      </div>
                      {c.email && <div className="text-slate-600 dark:text-slate-300">✉ {c.email}</div>}
                      {c.phone_mobile && (
                        <div className="text-slate-600 dark:text-slate-300">📱 {c.phone_mobile}</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 italic">No direct individual contacts found.</p>
              )}
            </div>

            {/* Links / Social */}
            {selectedCompany.links && selectedCompany.links.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('review.linksLabel')}
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedCompany.links.map((link: any, idx: number) => (
                    <a
                      key={link.id || idx}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-200 transition-colors"
                    >
                      <span className="capitalize font-semibold">{link.type}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Drawer>
      )}
    </div>
  );
};

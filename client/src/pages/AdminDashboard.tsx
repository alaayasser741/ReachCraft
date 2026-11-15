import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Shield,
  Send,
  Building2,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  UserX,
  UserCheck,
  Trash2,
  Sparkles,
  RefreshCw,
  Crown,
  BarChart3,
  CreditCard,
  FileCode2,
  ShieldCheck,
  ScrollText,
  Plus,
  Edit2,
  Eye,
  Check,
  X,
  Layers,
  Zap,
  MailPlus,
  Copy,
  ExternalLink,
  Clock,
  SendHorizontal,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { useToast } from '../components/ui/Toast';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';

export const AdminDashboard: React.FC = () => {
  const { isSuperAdmin, user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dir } = useTranslation();
  const { success: toastSuccess, error: toastError } = useToast();

  const isAr = dir === 'rtl';
  const activeTab = searchParams.get('tab') || 'overview';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [defaultTemplates, setDefaultTemplates] = useState<any[]>([]);
  const [verifiedContacts, setVerifiedContacts] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [logsTotal, setLogsTotal] = useState(0);
  const [logsPage, setLogsPage] = useState(1);

  // Search & filter states
  const [userSearch, setUserSearch] = useState('');
  const [verifiedSearch, setVerifiedSearch] = useState('');
  const [logSearch, setLogSearch] = useState('');
  const [logCategory, setLogCategory] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<number | string | null>(null);

  // Modals state
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [planForm, setPlanForm] = useState({
    id: '',
    name_ar: '',
    name_en: '',
    daily_email_limit: 100,
    monthly_upload_limit: 20,
    max_contacts: 1000,
    can_export_csv: true,
    can_use_ai: true,
    is_active: true,
  });

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    channel: 'email' as 'email' | 'whatsapp',
    subject: '',
    body: '',
  });
  const [previewTemplate, setPreviewTemplate] = useState<any | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactForm, setContactForm] = useState({
    person_name: '',
    job_title: '',
    email: '',
    phone_mobile: '',
    whatsapp_number: '',
    company_name: '',
    company_website: '',
    company_description: '',
  });

  // Invitations State (دعوات التجربة)
  const [invitations, setInvitations] = useState<any[]>([]);
  const [invitationStats, setInvitationStats] = useState<any>(null);
  const [invitationSearch, setInvitationSearch] = useState('');
  const [invitationStatus, setInvitationStatus] = useState('all');
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [isBulkInvite, setIsBulkInvite] = useState(false);
  const [isSendingInvite, setIsSendingInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    email: '',
    bulkEmails: '',
    name: '',
    plan: 'beta_free',
    custom_message: '',
    language: 'ar' as 'ar' | 'en',
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    loadCurrentTabData();
  }, [isSuperAdmin, activeTab]);

  const loadCurrentTabData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await api.getAdminStats();
        setStats(res.stats);
      } else if (activeTab === 'users') {
        const res = await api.getAdminUsers(userSearch);
        setUsers(res.users);
      } else if (activeTab === 'invitations') {
        const res = await api.getAdminInvitations(invitationSearch, invitationStatus);
        setInvitations(res.invitations);
        setInvitationStats(res.stats);
      } else if (activeTab === 'plans') {
        const res = await api.getAdminPlans();
        setPlans(res.plans);
      } else if (activeTab === 'templates') {
        const res = await api.getAdminTemplates();
        setDefaultTemplates(res.templates);
      } else if (activeTab === 'verified') {
        const res = await api.getAdminVerifiedContacts(verifiedSearch);
        setVerifiedContacts(res.contacts);
      } else if (activeTab === 'logs') {
        const res = await api.getAdminLogs({
          category: logCategory !== 'all' ? logCategory : undefined,
          search: logSearch || undefined,
          page: logsPage,
          limit: 30,
        });
        setAuditLogs(res.logs);
        setLogsTotal(res.total);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  // --- USER ACTIONS ---
  const handleUserSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadCurrentTabData();
  };

  const handlePlanChange = async (userId: number, newPlan: string) => {
    setIsUpdating(userId);
    try {
      await api.updateAdminUserPlan(userId, newPlan);
      toastSuccess(isAr ? 'تم تعديل الباقة بنجاح' : 'Plan updated successfully');
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to update plan');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleStatusToggle = async (userId: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
    setIsUpdating(userId);
    try {
      await api.updateAdminUserStatus(userId, newStatus);
      toastSuccess(
        newStatus === 'active'
          ? (isAr ? 'تم تفعيل الحساب' : 'Account activated')
          : (isAr ? 'تم تجميد الحساب' : 'Account suspended')
      );
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to toggle status');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (userId: number, email: string) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف المستخدم ${email} وجميع بياناته نهائياً؟` : `Are you sure you want to permanently delete ${email}?`)) {
      return;
    }

    setIsUpdating(userId);
    try {
      await api.deleteAdminUser(userId);
      toastSuccess(isAr ? 'تم حذف المستخدم بنجاح' : 'User deleted successfully');
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete user');
    } finally {
      setIsUpdating(null);
    }
  };

  // --- INVITATION ACTIONS (دعوات التجربة) ---
  const handleOpenInviteModal = () => {
    setInviteForm({
      email: '',
      bulkEmails: '',
      name: '',
      plan: 'beta_free',
      custom_message: '',
      language: isAr ? 'ar' : 'en',
    });
    setIsBulkInvite(false);
    setInviteModalOpen(true);
  };

  const handleSendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingInvite(true);
    try {
      if (isBulkInvite) {
        const emails = inviteForm.bulkEmails
          .split(/[\n,]+/)
          .map((em) => em.trim())
          .filter((em) => em.length > 0 && em.includes('@'));

        if (emails.length === 0) {
          toastError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح واحد على الأقل' : 'Please enter at least one valid email');
          setIsSendingInvite(false);
          return;
        }

        const res = await api.sendAdminInvitation({
          emails,
          plan: inviteForm.plan,
          custom_message: inviteForm.custom_message,
          language: inviteForm.language,
        });

        toastSuccess(res.message);
      } else {
        if (!inviteForm.email || !inviteForm.email.includes('@')) {
          toastError(isAr ? 'يرجى إدخال بريد إلكتروني صحيح' : 'Please enter a valid email');
          setIsSendingInvite(false);
          return;
        }

        const res = await api.sendAdminInvitation({
          email: inviteForm.email,
          name: inviteForm.name,
          plan: inviteForm.plan,
          custom_message: inviteForm.custom_message,
          language: inviteForm.language,
        });

        toastSuccess(res.message);
      }

      setInviteModalOpen(false);
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to send invitation');
    } finally {
      setIsSendingInvite(false);
    }
  };

  const handleResendInvitation = async (id: number, email: string) => {
    setIsUpdating(id);
    try {
      await api.resendAdminInvitation(id);
      toastSuccess(isAr ? `تمت إعادة إرسال الدعوة إلى ${email} بنجاح` : `Invitation resent to ${email}`);
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to resend invitation');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteInvitation = async (id: number, email: string) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف وإلغاء دعوة ${email}؟` : `Revoke invitation for ${email}?`)) {
      return;
    }
    setIsUpdating(id);
    try {
      await api.deleteAdminInvitation(id);
      toastSuccess(isAr ? 'تم حذف الدعوة بنجاح' : 'Invitation deleted');
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete invitation');
    } finally {
      setIsUpdating(null);
    }
  };

  const copyInviteLink = (token: string, email: string) => {
    const origin = window.location.origin;
    const link = `${origin}/register?invitation=${token}&email=${encodeURIComponent(email)}`;
    navigator.clipboard.writeText(link);
    toastSuccess(isAr ? 'تم نسخ رابط الدعوة إلى الحافظة' : 'Invitation link copied to clipboard');
  };

  // --- PLANS ACTIONS ---
  const openCreatePlanModal = () => {
    setEditingPlan(null);
    setPlanForm({
      id: '',
      name_ar: '',
      name_en: '',
      daily_email_limit: 100,
      monthly_upload_limit: 20,
      max_contacts: 1000,
      can_export_csv: true,
      can_use_ai: true,
      is_active: true,
    });
    setPlanModalOpen(true);
  };

  const openEditPlanModal = (p: any) => {
    setEditingPlan(p);
    setPlanForm({
      id: p.id,
      name_ar: p.name_ar,
      name_en: p.name_en,
      daily_email_limit: p.daily_email_limit,
      monthly_upload_limit: p.monthly_upload_limit,
      max_contacts: p.max_contacts,
      can_export_csv: Boolean(p.can_export_csv),
      can_use_ai: Boolean(p.can_use_ai),
      is_active: Boolean(p.is_active),
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.updateAdminPlan(editingPlan.id, planForm);
        toastSuccess(isAr ? 'تم تحديث بيانات الباقة بنجاح' : 'Plan updated successfully');
      } else {
        await api.createAdminPlan(planForm);
        toastSuccess(isAr ? 'تم إنشاء الباقة بنجاح' : 'Plan created successfully');
      }
      setPlanModalOpen(false);
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف الباقة "${name}"؟ سيتم تحويل المشتركين فيها للباقة المجانية.` : `Delete plan ${name}?`)) {
      return;
    }
    try {
      await api.deleteAdminPlan(id);
      toastSuccess(isAr ? 'تم حذف الباقة بنجاح' : 'Plan deleted successfully');
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete plan');
    }
  };

  // --- DEFAULT TEMPLATES ACTIONS ---
  const openCreateTemplateModal = () => {
    setEditingTemplate(null);
    setTemplateForm({
      name: '',
      channel: 'email',
      subject: '',
      body: '',
    });
    setTemplateModalOpen(true);
  };

  const openEditTemplateModal = (t: any) => {
    setEditingTemplate(t);
    setTemplateForm({
      name: t.name,
      channel: t.channel,
      subject: t.subject || '',
      body: t.body,
    });
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        await api.updateAdminTemplate(editingTemplate.id, templateForm);
        toastSuccess(isAr ? 'تم تعديل القالب الافتراضي بنجاح' : 'Default template updated');
      } else {
        await api.createAdminTemplate(templateForm);
        toastSuccess(isAr ? 'تم إنشاء القالب الافتراضي بنجاح' : 'Default template created');
      }
      setTemplateModalOpen(false);
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: number, name: string) => {
    if (!window.confirm(isAr ? `هل أنت متأكد من حذف القالب الافتراضي "${name}"؟` : `Delete template ${name}?`)) {
      return;
    }
    try {
      await api.deleteAdminTemplate(id);
      toastSuccess(isAr ? 'تم حذف القالب الافتراضي بنجاح' : 'Default template deleted');
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to delete template');
    }
  };

  // --- VERIFIED CONTACTS ACTIONS ---
  const handleSaveVerifiedContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createAdminVerifiedContact(contactForm);
      toastSuccess(isAr ? 'تمت إضافة جهة الاتصال إلى قاعدة البيانات الموثقة' : 'Verified contact added');
      setContactModalOpen(false);
      setContactForm({
        person_name: '',
        job_title: '',
        email: '',
        phone_mobile: '',
        whatsapp_number: '',
        company_name: '',
        company_website: '',
        company_description: '',
      });
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to add verified contact');
    }
  };

  const handleRemoveVerifiedContact = async (id: number, name: string) => {
    if (!window.confirm(isAr ? `إزالة جهة الاتصال "${name}" من قاعدة المعارض الموثقة؟` : `Remove ${name} from verified pool?`)) {
      return;
    }
    try {
      await api.removeAdminVerifiedContact(id);
      toastSuccess(isAr ? 'تمت إزالة جهة الاتصال من القائمة الموثقة' : 'Removed from verified pool');
      loadCurrentTabData();
    } catch (err: any) {
      toastError(err.message || 'Failed to remove contact');
    }
  };

  if (!isSuperAdmin) return null;

  return (
    <div className="space-y-6" dir={dir}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isAr ? 'لوحة تحكم إدارة النظام (Super Admin)' : 'System Super Admin Panel'}
            </h1>
            <span className="inline-flex items-center gap-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 text-xs font-bold px-2.5 py-0.5 rounded-full border border-purple-500/20">
              <Crown className="w-3.5 h-3.5" />
              {isAr ? 'إدارة المنصة الشاملة' : 'Platform Control'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? 'مراقبة حية، إدارة المستخدمين، تخصيص الباقات، قوالب النظام، وجهات الاتصال الموثقة'
              : 'Full telemetry, user lifecycle, plan tiers, default templates, and curated leads pool'}
          </p>
        </div>

        <button
          onClick={loadCurrentTabData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isAr ? 'تحديث البيانات' : 'Refresh Data'}</span>
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto">
        {[
          { id: 'overview', label: isAr ? 'نظرة عامة ومراقبة' : 'Overview', icon: BarChart3 },
          { id: 'users', label: isAr ? 'إدارة المستخدمين' : 'Users', icon: Users },
          { id: 'invitations', label: isAr ? 'دعوات التجربة' : 'Invitations', icon: MailPlus },
          { id: 'plans', label: isAr ? 'الباقات والحدود' : 'Plans', icon: CreditCard },
          { id: 'templates', label: isAr ? 'القوالب الافتراضية' : 'Default Templates', icon: FileCode2 },
          { id: 'verified', label: isAr ? 'قاعدة الاتصال الموثقة' : 'Verified Pool', icon: ShieldCheck },
          { id: 'logs', label: isAr ? 'سجل تدقيق المنصة' : 'Audit Logs', icon: ScrollText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs border border-slate-200/60 dark:border-slate-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-600 dark:text-purple-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* TAB 1: OVERVIEW & TELEMETRY                               */}
      {/* ========================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'إجمالي المستخدمين' : 'Total Users'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats?.totalUsers || 0}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{stats?.activeUsers || 0} {isAr ? 'حساب نشط' : 'active accounts'}</span>
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'إيميلات اليوم' : 'Emails Today'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats?.emailsSentToday || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.totalEmailsSent || 0} {isAr ? 'إجمالي كل الإرسال' : 'all-time sent'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'الشركات والجهات' : 'Leads & Companies'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats?.totalCompanies || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.totalContacts || 0} {isAr ? 'جهة اتصال موثقة' : 'verified contacts'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'الحملات والكتالوجات' : 'Campaigns & Files'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {stats?.totalCampaigns || 0}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats?.totalFiles || 0} {isAr ? 'كتالوج مرفوع' : 'files parsed'}
              </p>
            </Card>
          </div>

          {/* Quick Shortcuts & Distribution Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-600" />
                <span>{isAr ? 'توزيع المشتركين حسب الباقات' : 'Subscriber Distribution by Plan'}</span>
              </h3>
              <div className="space-y-3">
                {stats?.planBreakdown && stats.planBreakdown.map((p: any) => (
                  <div key={p.plan} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 uppercase">
                      {p.plan}
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      {p.count} {isAr ? 'مستخدم' : 'users'}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>{isAr ? 'حالة المنصة ومؤشرات الأمان' : 'Platform & Security Health'}</span>
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="font-semibold">{isAr ? 'تشفير المفاتيح العسكري (AES-256-GCM)' : 'Military AES-256-GCM Encryption'}</span>
                  <span className="font-bold text-[11px] bg-emerald-600 text-white px-2 py-0.5 rounded">ONLINE</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                  <span className="font-semibold">{isAr ? 'خادم إرسال أكواد التحقق (Nodemailer Official)' : 'Official OTP Mailer Service'}</span>
                  <span className="font-bold text-[11px] bg-blue-600 text-white px-2 py-0.5 rounded">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700/50">
                  <span className="font-semibold">{isAr ? 'عزل المستأجرين (Multi-Tenant Isolation)' : 'Multi-Tenant Data Isolation'}</span>
                  <span className="font-bold text-[11px] bg-slate-700 text-white px-2 py-0.5 rounded">ENFORCED</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: USER MANAGEMENT                                    */}
      {/* ========================================================= */}
      {activeTab === 'users' && (
        <Card className="p-5 sm:p-6 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'إدارة المستخدمين والمشتركين' : 'User & Subscriber Management'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAr ? 'تحكم بالباقات، تجميد أو تفعيل الحسابات، ومراقبة النشاط' : 'Manage tiers, suspend/activate accounts, and inspect usage'}
              </p>
            </div>

            <form onSubmit={handleUserSearch} className="flex gap-2 max-w-sm w-full">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={isAr ? 'بحث بالاسم أو البريد...' : 'Search by name or email...'}
                  className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-800"
              >
                {isAr ? 'بحث' : 'Search'}
              </button>
            </form>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'تاريخ التسجيل' : 'Registered'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الباقة الحالية' : 'Plan'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الاستهلاك' : 'Usage'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const isSelf = u.id === currentUser?.id;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                            {u.name ? u.name[0].toUpperCase() : u.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name || (isAr ? 'مستخدم بدون اسم' : 'Unnamed')}</span>
                              {u.role === 'super_admin' && (
                                <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold px-1.5 py-0.5 rounded">
                                  Admin
                                </span>
                              )}
                            </p>
                            <p className="text-slate-400 font-mono text-[11px]">{u.email}</p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(u.created_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4">
                        <select
                          value={u.plan}
                          disabled={isUpdating === u.id || isSelf}
                          onChange={(e) => handlePlanChange(u.id, e.target.value)}
                          className="text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
                        >
                          <option value="beta_free">{isAr ? 'النسخة المجانية (Beta)' : 'Beta Free'}</option>
                          <option value="pro">{isAr ? 'الاحترافية (Pro Growth)' : 'Pro Growth'}</option>
                          <option value="unlimited">{isAr ? 'غير محدود (Unlimited)' : 'Unlimited'}</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-400">
                          <div>
                            <strong className="text-slate-900 dark:text-white">{u.companies_count}</strong> {isAr ? 'شركة' : 'companies'}
                          </div>
                          <div>
                            <strong className="text-slate-900 dark:text-white">{u.emails_sent_today}</strong> {isAr ? 'إيميل اليوم' : 'emails today'}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3" />
                            {isAr ? 'نشط' : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-800/40">
                            <AlertTriangle className="w-3 h-3" />
                            {isAr ? 'معلق / محظور' : 'Suspended'}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-end">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isSelf && (
                            <>
                              <button
                                type="button"
                                disabled={isUpdating === u.id}
                                onClick={() => handleStatusToggle(u.id, u.status)}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  u.status === 'active'
                                    ? 'border-amber-200 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                    : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                                }`}
                                title={u.status === 'active' ? (isAr ? 'تجميد الحساب' : 'Suspend') : (isAr ? 'تفعيل الحساب' : 'Activate')}
                              >
                                {u.status === 'active' ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </button>

                              <button
                                type="button"
                                disabled={isUpdating === u.id}
                                onClick={() => handleDeleteUser(u.id, u.email)}
                                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                                title={isAr ? 'حذف الحساب' : 'Delete user'}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {isSelf && (
                            <span className="text-[11px] text-slate-400 font-semibold px-2 py-1">
                              {isAr ? '(أنت)' : '(You)'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {users.length === 0 && !isLoading && (
              <div className="text-center py-10 text-slate-400 text-xs">
                {isAr ? 'لا يوجد مستخدمين مطابقين للبحث' : 'No users found matching your search'}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB: INVITATIONS (دعوات التجربة)                         */}
      {/* ========================================================= */}
      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Telemetry Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'إجمالي الدعوات' : 'Total Invitations'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <MailPlus className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
                {invitationStats?.total || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'دعوة تم إرسالها' : 'invitations dispatched'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'تم التسجيل والقبول' : 'Accepted & Joined'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">
                {invitationStats?.accepted || 0}
              </p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                {isAr ? 'حساب قام بالتسجيل' : 'registered accounts'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'في انتظار التسجيل' : 'Pending'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-2">
                {invitationStats?.pending || 0}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'صالح لمدة 14 يوماً' : 'valid for 14 days'}
              </p>
            </Card>

            <Card className="p-4 sm:p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {isAr ? 'نسبة التحويل' : 'Conversion Rate'}
                </span>
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
              <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 mt-2">
                {invitationStats?.conversionRate || 0}%
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? 'معدل قبول الدعوات' : 'acceptance rate'}
              </p>
            </Card>
          </div>

          {/* Action Header & Search */}
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isAr ? 'سجل دعوات تجربة المنصة' : 'Platform Trial Invitations'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {isAr
                    ? 'إرسال دعوات عبر البريد الإلكتروني مع روابط مخصصة لتجربة المنصة، ومتابعة من سجل ومن لم يسجل بعد.'
                    : 'Dispatch email invitations with custom onboarding links and track registration status.'}
                </p>
              </div>

              <Button
                onClick={handleOpenInviteModal}
                className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20"
              >
                <MailPlus className="w-4 h-4" />
                <span>{isAr ? 'إرسال دعوة جديدة' : 'Send New Invitation'}</span>
              </Button>
            </div>

            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="relative flex-1">
                <Search className={`w-4 h-4 absolute top-1/2 -translate-y-1/2 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
                <input
                  type="text"
                  value={invitationSearch}
                  onChange={(e) => setInvitationSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadCurrentTabData()}
                  placeholder={isAr ? 'بحث بالبريد الإلكتروني أو الاسم...' : 'Search by email or name...'}
                  className={`w-full py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                    isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
                  }`}
                />
              </div>

              <select
                value={invitationStatus}
                onChange={(e) => {
                  setInvitationStatus(e.target.value);
                }}
                className="py-1.5 px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
                <option value="sent">{isAr ? 'معلقة (بانتظار التسجيل)' : 'Pending (Sent)'}</option>
                <option value="accepted">{isAr ? 'مقبولة (تم التسجيل)' : 'Accepted (Registered)'}</option>
                <option value="expired">{isAr ? 'منتهية الصلاحية' : 'Expired'}</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                onClick={loadCurrentTabData}
                className="text-xs"
              >
                <span>{isAr ? 'تطبيق الفلتر' : 'Filter'}</span>
              </Button>
            </div>

            {/* Invitations Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold bg-slate-50/50 dark:bg-slate-850/50">
                    <th className="py-3 px-4 text-start">{isAr ? 'المدعو' : 'Invitee'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الباقة الممنوحة' : 'Assigned Plan'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الحالة' : 'Status'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'تاريخ الإرسال' : 'Sent Date'}</th>
                    <th className="py-3 px-4 text-start">{isAr ? 'الصلاحية' : 'Expires At'}</th>
                    <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invitations.map((inv) => {
                    const isAccepted = inv.status === 'accepted';
                    const isExpired = inv.status === 'expired' || (!isAccepted && new Date(inv.expires_at) < new Date());

                    return (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0">
                              {(inv.name ? inv.name[0] : inv.email[0]).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 dark:text-white truncate">
                                {inv.name || (isAr ? 'بدون اسم' : 'Unnamed')}
                              </p>
                              <p className="text-slate-400 font-mono text-[11px] truncate">{inv.email}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {inv.plan === 'pro' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <Crown className="w-3 h-3 text-amber-500" />
                              <span>{isAr ? 'احترافية (Pro VIP)' : 'Pro VIP Plan'}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                              <span>{isAr ? 'تجريبية مجانية' : 'Beta Free'}</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isAccepted ? (
                            <Badge variant="success" size="sm">
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                {isAr ? 'تم التسجيل والقبول' : 'Accepted & Joined'}
                              </span>
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive" size="sm">
                              {isAr ? 'منتهية الصلاحية' : 'Expired'}
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {isAr ? 'معلقة (بانتظار التسجيل)' : 'Pending'}
                              </span>
                            </Badge>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(inv.sent_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                          {new Date(inv.expires_at).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Copy direct invite URL */}
                            <button
                              type="button"
                              onClick={() => copyInviteLink(inv.token, inv.email)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                              title={isAr ? 'نسخ رابط الدعوة المباشر للمشاركة' : 'Copy direct invitation link'}
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            {/* Resend email */}
                            {!isAccepted && (
                              <button
                                type="button"
                                disabled={isUpdating === inv.id}
                                onClick={() => handleResendInvitation(inv.id, inv.email)}
                                className="p-1.5 rounded-lg border border-brand-200 dark:border-brand-800 text-brand-600 dark:text-brand-400 hover:bg-brand-50 dark:hover:bg-brand-950/40 transition-all"
                                title={isAr ? 'إعادة إرسال الإيميل' : 'Resend invitation email'}
                              >
                                <SendHorizontal className={`w-3.5 h-3.5 ${isUpdating === inv.id ? 'animate-spin' : ''}`} />
                              </button>
                            )}

                            {/* Delete invitation */}
                            <button
                              type="button"
                              disabled={isUpdating === inv.id}
                              onClick={() => handleDeleteInvitation(inv.id, inv.email)}
                              className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                              title={isAr ? 'حذف الدعوة' : 'Delete invitation'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {invitations.length === 0 && !isLoading && (
                <div className="text-center py-12 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 mx-auto flex items-center justify-center">
                    <MailPlus className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {isAr ? 'لا توجد دعوات مرسلة حالياً' : 'No invitations found'}
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {isAr
                      ? 'يمكنك البدء بدعوة عملائك أو زملائك لتجربة المنصة فوراً عن طريق إرسال أول دعوة.'
                      : 'Send your first platform invitation to welcome users to experience ReachCraft.'}
                  </p>
                  <Button
                    onClick={handleOpenInviteModal}
                    size="sm"
                    className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold"
                  >
                    <Plus className="w-3.5 h-3.5 ms-1" />
                    <span>{isAr ? 'إرسال أول دعوة الآن' : 'Send First Invitation'}</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: PLANS MANAGEMENT (CRUD)                            */}
      {/* ========================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'إدارة باقات الاشتراك والحدود' : 'Plans & Tier Quotas'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'إنشاء وتعديل وحذف الباقات وتحديد الحدود اليومية والشهرية' : 'Create, edit, and configure plan limits and feature access'}
              </p>
            </div>
            <Button onClick={openCreatePlanModal} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs">
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة باقة جديدة' : 'Add New Plan'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p) => {
              const isDefaultPlan = ['beta_free', 'unlimited'].includes(p.id);
              return (
                <Card key={p.id} className="p-5 flex flex-col justify-between border-2 border-slate-200/80 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-900 transition-all">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {p.id}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                        {p.users_count || 0} {isAr ? 'مشترك' : 'users'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {isAr ? p.name_ar : p.name_en}
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">{isAr ? p.name_en : p.name_ar}</p>

                    <div className="space-y-2 text-xs py-3 border-y border-slate-100 dark:border-slate-800">
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isAr ? 'الحد اليومي للإيميلات:' : 'Daily Email Limit:'}</span>
                        <strong className="text-slate-900 dark:text-white">{p.daily_email_limit} / {isAr ? 'يوم' : 'day'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isAr ? 'الملفات المرفوعة شهرياً:' : 'Monthly Uploads:'}</span>
                        <strong className="text-slate-900 dark:text-white">{p.monthly_upload_limit} / {isAr ? 'شهر' : 'month'}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isAr ? 'الحد الأقصى للجهات:' : 'Max Contacts:'}</span>
                        <strong className="text-slate-900 dark:text-white">{p.max_contacts.toLocaleString()}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">{isAr ? 'الذكاء الاصطناعي (Gemini):' : 'AI Capabilities:'}</span>
                        <strong className={p.can_use_ai ? 'text-emerald-600' : 'text-slate-400'}>
                          {p.can_use_ai ? (isAr ? 'متاح' : 'Enabled') : (isAr ? 'معطل' : 'Disabled')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 pt-2">
                    <button
                      onClick={() => openEditPlanModal(p)}
                      className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-1.5 transition-all"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'تعديل الحدود' : 'Edit Quotas'}</span>
                    </button>
                    {!isDefaultPlan && (
                      <button
                        onClick={() => handleDeletePlan(p.id, p.name_ar)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                        title={isAr ? 'حذف الباقة' : 'Delete plan'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: DEFAULT TEMPLATES MANAGEMENT                       */}
      {/* ========================================================= */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'إدارة القوالب الافتراضية للمنصة' : 'Platform Default Templates'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'قوالب جاهزة تظهر تلقائياً لجميع المستخدمين المسجلين في حساباتهم' : 'System templates visible to all registered tenants'}
              </p>
            </div>
            <Button onClick={openCreateTemplateModal} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs">
              <Plus className="w-4 h-4" />
              <span>{isAr ? 'إضافة قالب افتراضي' : 'Add Default Template'}</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {defaultTemplates.map((t) => (
              <Card key={t.id} className="p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                      {t.channel}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200/50">
                      {isAr ? 'افتراضي للنظام' : 'System Default'}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900 dark:text-white">{t.name}</h3>
                  {t.subject && (
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      <strong>{isAr ? 'العنوان:' : 'Subject:'}</strong> {t.subject}
                    </p>
                  )}

                  <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 max-h-32 overflow-y-auto font-mono text-[11px] border border-slate-200/50 dark:border-slate-700/50">
                    <div dangerouslySetInnerHTML={{ __html: t.body }} />
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => setPreviewTemplate(t)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs"
                    title={isAr ? 'معاينة' : 'Preview'}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openEditTemplateModal(t)}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تعديل' : 'Edit'}</span>
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(t.id, t.name)}
                    className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                    title={isAr ? 'حذف' : 'Delete'}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: VERIFIED CONTACTS POOL                             */}
      {/* ========================================================= */}
      {activeTab === 'verified' && (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'قاعدة جهات الاتصال والمعارض الموثقة' : 'Verified B2B Leads Pool'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'قائمة جهات اتصال معتمدة وموثقة يضيفها الأدمن ليستفيد منها جميع مستخدمي المنصة' : 'Curated verified leads available for all tenants to browse and reach'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={() => setContactModalOpen(true)} className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs">
                <Plus className="w-4 h-4" />
                <span>{isAr ? 'إضافة جهة اتصال موثقة' : 'Add Verified Lead'}</span>
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'الاسم والمنصب' : 'Contact'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الشركة' : 'Company'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الهاتف / واتساب' : 'Phone / WA'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {verifiedContacts.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{c.person_name || (isAr ? 'مسؤول غير محدد' : 'Unknown')}</div>
                      <div className="text-[11px] font-normal text-slate-400">{c.job_title || ''}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-800 dark:text-slate-200 font-semibold">
                      {c.company_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {c.email || '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {c.phone_mobile || c.whatsapp_number || '-'}
                    </td>
                    <td className="py-3 px-4 text-end">
                      <button
                        onClick={() => handleRemoveVerifiedContact(c.id, c.person_name || c.company_name)}
                        className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs"
                        title={isAr ? 'إزالة من الموثقة' : 'Remove from pool'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {verifiedContacts.length === 0 && !isLoading && (
              <div className="text-center py-10 text-slate-400 text-xs">
                {isAr ? 'لا توجد جهات اتصال موثقة مضافة حتى الآن' : 'No verified leads in pool yet'}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* TAB 6: GLOBAL AUDIT LOGS                                  */}
      {/* ========================================================= */}
      {activeTab === 'logs' && (
        <Card className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isAr ? 'سجل تدقيق المنصة العام (Global Audit Logs)' : 'Global Platform Audit Trail'}
              </h2>
              <p className="text-xs text-slate-500">
                {isAr ? 'تتبع لحظي وشامل لجميع العمليات التي يجريها كل المستخدمين في المنصة' : 'Platform-wide activity log capturing every user action'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={logCategory}
                onChange={(e) => setLogCategory(e.target.value)}
                className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="all">{isAr ? 'كل الفئات' : 'All Categories'}</option>
                <option value="auth">{isAr ? 'الأمان والحسابات' : 'Auth'}</option>
                <option value="campaign">{isAr ? 'الحملات' : 'Campaigns'}</option>
                <option value="message">{isAr ? 'الرسائل' : 'Messages'}</option>
                <option value="file">{isAr ? 'الملفات' : 'Files'}</option>
                <option value="admin">{isAr ? 'إجراءات الإدارة' : 'Admin Actions'}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 text-start">{isAr ? 'الوقت' : 'Timestamp'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'المستخدم' : 'User'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'الفئة والحدث' : 'Event'}</th>
                  <th className="py-3 px-4 text-start">{isAr ? 'التفاصيل' : 'Details'}</th>
                  <th className="py-3 px-4 text-end">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {auditLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-4 text-slate-500 whitespace-nowrap font-mono text-[11px]">
                      {new Date(l.created_at).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">
                      {l.user_email || `User #${l.user_id || 'System'}`}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-bold text-slate-900 dark:text-white">{l.title}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{l.category} / {l.action}</span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] max-w-xs truncate">
                      {l.details || '-'}
                    </td>
                    <td className="py-2.5 px-4 text-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        l.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT PLAN                                 */}
      {/* ========================================================= */}
      {planModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingPlan ? (isAr ? 'تعديل بيانات الباقة' : 'Edit Plan') : (isAr ? 'إضافة باقة جديدة' : 'Add New Plan')}
            </h3>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              {!editingPlan && (
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'معرّف الباقة (ID بالإنجليزية فقط)' : 'Plan ID'}</label>
                  <input
                    type="text"
                    required
                    value={planForm.id}
                    onChange={(e) => setPlanForm({ ...planForm, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                    placeholder="e.g. enterprise"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الاسم بالعربية' : 'Arabic Name'}</label>
                  <input
                    type="text"
                    required
                    value={planForm.name_ar}
                    onChange={(e) => setPlanForm({ ...planForm, name_ar: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'الاسم بالإنجليزية' : 'English Name'}</label>
                  <input
                    type="text"
                    required
                    value={planForm.name_en}
                    onChange={(e) => setPlanForm({ ...planForm, name_en: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'إيميل يومي' : 'Daily Emails'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.daily_email_limit}
                    onChange={(e) => setPlanForm({ ...planForm, daily_email_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رفع ملفات/شهر' : 'Uploads/Mo'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.monthly_upload_limit}
                    onChange={(e) => setPlanForm({ ...planForm, monthly_upload_limit: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'أقصى جهات' : 'Max Contacts'}</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={planForm.max_contacts}
                    onChange={(e) => setPlanForm({ ...planForm, max_contacts: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.can_use_ai}
                    onChange={(e) => setPlanForm({ ...planForm, can_use_ai: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>{isAr ? 'تفعيل الذكاء الاصطناعي (Gemini)' : 'Enable AI'}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planForm.can_export_csv}
                    onChange={(e) => setPlanForm({ ...planForm, can_export_csv: e.target.checked })}
                    className="rounded text-purple-600 focus:ring-purple-500"
                  />
                  <span>{isAr ? 'تصدير CSV' : 'CSV Export'}</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setPlanModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                  {isAr ? 'حفظ' : 'Save Plan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT DEFAULT TEMPLATE                     */}
      {/* ========================================================= */}
      {templateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {editingTemplate ? (isAr ? 'تعديل القالب الافتراضي' : 'Edit Default Template') : (isAr ? 'إضافة قالب افتراضي للمنصة' : 'Add Default Template')}
            </h3>

            <form onSubmit={handleSaveTemplate} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اسم القالب' : 'Template Name'}</label>
                <input
                  type="text"
                  required
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g. Sales Intro Template"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'عنوان الرسالة (Subject)' : 'Email Subject'}</label>
                <input
                  type="text"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                  placeholder="e.g. Partnership Opportunity with {{company_name}}"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'محتوى الرسالة (يدعم HTML والمتغيرات مثل {{person_name}})' : 'Message Body'}</label>
                <textarea
                  required
                  rows={8}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
                  placeholder="<p>Hi {{person_name}},</p>..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTemplateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                  {isAr ? 'حفظ القالب' : 'Save Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD VERIFIED CONTACT                               */}
      {/* ========================================================= */}
      {contactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {isAr ? 'إضافة جهة اتصال موثقة لقاعدة المنصة' : 'Add Verified Lead to Pool'}
            </h3>

            <form onSubmit={handleSaveVerifiedContact} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اسم الشخص' : 'Contact Name'}</label>
                  <input
                    type="text"
                    value={contactForm.person_name}
                    onChange={(e) => setContactForm({ ...contactForm, person_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'المسمى الوظيفي' : 'Job Title'}</label>
                  <input
                    type="text"
                    value={contactForm.job_title}
                    onChange={(e) => setContactForm({ ...contactForm, job_title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'اسم الشركة *' : 'Company Name *'}</label>
                  <input
                    type="text"
                    required
                    value={contactForm.company_name}
                    onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'موقع الشركة' : 'Company Website'}</label>
                  <input
                    type="text"
                    value={contactForm.company_website}
                    onChange={(e) => setContactForm({ ...contactForm, company_website: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'رقم الهاتف / واتساب' : 'Phone / WhatsApp'}</label>
                  <input
                    type="text"
                    value={contactForm.phone_mobile}
                    onChange={(e) => setContactForm({ ...contactForm, phone_mobile: e.target.value, whatsapp_number: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">{isAr ? 'وصف أو مجال عمل الشركة' : 'Company Description'}</label>
                <textarea
                  rows={2}
                  value={contactForm.company_description}
                  onChange={(e) => setContactForm({ ...contactForm, company_description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setContactModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-semibold"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold hover:bg-purple-700"
                >
                  {isAr ? 'إضافة إلى القاعدة' : 'Add to Pool'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PREVIEW TEMPLATE                                   */}
      {/* ========================================================= */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">{previewTemplate.name}</h3>
              <button onClick={() => setPreviewTemplate(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {previewTemplate.subject && (
              <div className="text-xs">
                <span className="text-slate-400 font-semibold">{isAr ? 'العنوان: ' : 'Subject: '}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{previewTemplate.subject}</span>
              </div>
            )}
            <div
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-800 dark:text-slate-200 max-h-72 overflow-y-auto border border-slate-200/50 dark:border-slate-700/50"
              dangerouslySetInnerHTML={{ __html: previewTemplate.body }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SEND INVITATION (دعوة لتجربة المنصة)                */}
      {/* ========================================================= */}
      {inviteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-3.5 border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center">
                  <MailPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    {isAr ? 'إرسال دعوة لتجربة ReachCraft' : 'Send ReachCraft Trial Invitation'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isAr
                      ? 'سيصل إيميل رسمي احترافي للمدعو مع رابط تفعيل مباشر'
                      : 'An official invitation email will be sent with direct activation link'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInviteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Single vs Bulk Mode Toggle */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 dark:bg-slate-850 rounded-xl text-xs font-semibold">
              <button
                type="button"
                onClick={() => setIsBulkInvite(false)}
                className={`py-2 px-3 rounded-lg transition-all text-center ${
                  !isBulkInvite
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'دعوة فردية (Single)' : 'Single Invitation'}
              </button>
              <button
                type="button"
                onClick={() => setIsBulkInvite(true)}
                className={`py-2 px-3 rounded-lg transition-all text-center ${
                  isBulkInvite
                    ? 'bg-white dark:bg-slate-800 text-brand-600 dark:text-brand-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {isAr ? 'دعوات متعددة (Bulk)' : 'Bulk Invitations'}
              </button>
            </div>

            <form onSubmit={handleSendInvitation} className="space-y-4">
              {/* Form inputs according to mode */}
              {!isBulkInvite ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'البريد الإلكتروني للمدعو *' : 'Invitee Email Address *'}
                    </label>
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                      placeholder="client@company.com"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      {isAr ? 'اسم المدعو (اختياري)' : 'Invitee Name (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm({ ...inviteForm, name: e.target.value })}
                      placeholder={isAr ? 'مثال: أ. أحمد مصطفى' : 'e.g. John Doe'}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                    />
                  </div>
                </>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {isAr ? 'قائمة الإيميلات (مفصولة بسطر أو فاصلة) *' : 'Email List (Comma or Line Separated) *'}
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {
                        inviteForm.bulkEmails
                          .split(/[\n,]+/)
                          .map((e) => e.trim())
                          .filter((e) => e.includes('@')).length
                      }{' '}
                      {isAr ? 'إيميل محدد' : 'detected'}
                    </span>
                  </div>
                  <textarea
                    required
                    rows={4}
                    value={inviteForm.bulkEmails}
                    onChange={(e) => setInviteForm({ ...inviteForm, bulkEmails: e.target.value })}
                    placeholder="founder@startup.com&#10;cto@agency.co&#10;sales@company.com"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30 font-mono"
                  />
                </div>
              )}

              {/* Plan & Language Selection */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'الباقة الممنوحة عند التسجيل' : 'Assigned Plan'}
                  </label>
                  <select
                    value={inviteForm.plan}
                    onChange={(e) => setInviteForm({ ...inviteForm, plan: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="beta_free">{isAr ? 'Beta Free (تجربة بيتا مجانية)' : 'Beta Free Trial'}</option>
                    <option value="pro">{isAr ? 'Pro Plan (باقة المحترفين كاملة)' : 'Pro Plan'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'لغة الإيميل' : 'Email Language'}
                  </label>
                  <select
                    value={inviteForm.language}
                    onChange={(e) => setInviteForm({ ...inviteForm, language: e.target.value as 'ar' | 'en' })}
                    className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                  >
                    <option value="ar">{isAr ? 'العربية (Arabic)' : 'Arabic (العربية)'}</option>
                    <option value="en">{isAr ? 'الإنجليزية (English)' : 'English'}</option>
                  </select>
                </div>
              </div>

              {/* Custom Personal Note in Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'ملاحظة شخصية من الأدمن (اختياري تظهر في الإيميل)' : 'Personal Note (Optional, shown in email)'}
                </label>
                <textarea
                  rows={2}
                  value={inviteForm.custom_message}
                  onChange={(e) => setInviteForm({ ...inviteForm, custom_message: e.target.value })}
                  placeholder={
                    isAr
                      ? 'يسعدنا جداً مشاركتك في تجربة النسخة الأولية لمنصة ReachCraft وإعطائنا ملاحظاتك القيمة...'
                      : "We'd love for you to test ReachCraft early access and share your feedback..."
                  }
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-brand-500/30"
                />
              </div>

              {/* Notice Box */}
              <div className="p-3 rounded-xl bg-brand-50 dark:bg-brand-950/40 border border-brand-200/50 dark:border-brand-900/50 flex items-start gap-2.5 text-xs text-brand-900 dark:text-brand-200">
                <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  {isAr ? (
                    <>
                      سيتلقى المدعو بريداً احترافياً يحتوي على رابط تسجيل مباشر وفريد. بمجرد دخوله وتسجيل حسابه (بالإيميل
                      أو حساب Google)، سيتم ترقية حسابه تلقائياً للباقة المختارة لمدة 14 يوماً مع تفعيل فوري.
                    </>
                  ) : (
                    <>
                      The invitee will receive a branded email with a unique activation link. Upon signing up (via OTP
                      or Google), their account will automatically be activated with the selected plan.
                    </>
                  )}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  disabled={isSendingInvite}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <Button
                  type="submit"
                  disabled={isSendingInvite}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold px-5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-brand-500/20"
                >
                  {isSendingInvite ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isAr ? 'جارِ الإرسال...' : 'Sending...'}</span>
                    </>
                  ) : (
                    <>
                      <SendHorizontal className="w-3.5 h-3.5" />
                      <span>{isAr ? 'إرسال الدعوة الآن' : 'Send Invitation Now'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

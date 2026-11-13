import React, { useEffect, useState } from 'react';
import {
  Inbox as InboxIcon,
  RefreshCw,
  Search,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Mail,
  Briefcase,
  Building2,
  MessageSquare,
  ChevronRight,
  Eye,
  Check,
  SendHorizontal,
  Flame,
  ArrowRight,
  CornerDownLeft,
  Languages,
  Trash2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Tabs } from '../components/ui/Tabs';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import { InboxMessage, InboxCounts, EmailCategory, EmailPriority } from '../types';

export const Inbox: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [counts, setCounts] = useState<InboxCounts>({
    all: 0,
    unread: 0,
    hr_interview: 0,
    company_update: 0,
    direct_reply: 0,
  });

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<InboxMessage | null>(null);

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string | null>(null);

  // Quick Reply States
  const [replyText, setReplyText] = useState('');
  const [customInstructions, setCustomInstructions] = useState('');
  const [isDrafting, setIsDrafting] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Translation & Management States
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedMap, setTranslatedMap] = useState<Record<number, { subject: string; body: string; targetLang: 'ar' | 'en' }>>({});
  const [showTranslation, setShowTranslation] = useState<Record<number, boolean>>({});
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadInbox(activeCategory, searchQuery);
  }, [activeCategory]);

  const loadInbox = async (category = activeCategory, search = searchQuery) => {
    setIsLoading(true);
    try {
      const res = await api.getInboxMessages({
        category: category === 'all' ? undefined : category,
        search: search.trim() || undefined,
        limit: 50,
      });
      setMessages(res.messages || []);
      setCounts(res.counts || { all: 0, unread: 0, hr_interview: 0, company_update: 0, direct_reply: 0 });

      // If nothing selected or selected message not in current list, select first
      if (res.messages.length > 0) {
        if (!selectedId || !res.messages.find((m) => m.id === selectedId)) {
          selectEmail(res.messages[0]);
        }
      } else {
        setSelectedId(null);
        setSelectedMessage(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load inbox');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await api.syncInbox(30);
      toastSuccess(res.message || 'Inbox synced successfully!');
      setLastSyncedTime(new Date().toLocaleTimeString(dir === 'rtl' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' }));
      await loadInbox(activeCategory, searchQuery);
    } catch (err: any) {
      toastError(err.message || 'Sync failed. Please check your SMTP/IMAP settings.');
    } finally {
      setIsSyncing(false);
    }
  };

  const selectEmail = async (msg: InboxMessage) => {
    setSelectedId(msg.id);
    setSelectedMessage(msg);
    setReplyText(msg.ai_suggested_reply || '');
    setCustomInstructions('');

    // Mark as read locally and remotely
    if (!msg.is_read) {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: 1 } : m)));
      setCounts((prev) => ({ ...prev, unread: Math.max(0, prev.unread - 1) }));
      api.markInboxRead(msg.id, true).catch(() => {});
    }

    // Load full details if html body wasn't fully loaded
    if (!msg.body_html && !msg.body_text) {
      try {
        const detailRes = await api.getInboxMessage(msg.id);
        if (detailRes.message) {
          setSelectedMessage(detailRes.message);
          if (detailRes.message.ai_suggested_reply) {
            setReplyText(detailRes.message.ai_suggested_reply);
          }
        }
      } catch {}
    }
  };

  const handleDraftReply = async (instructions?: string) => {
    if (!selectedMessage) return;
    setIsDrafting(true);
    try {
      const res = await api.draftInboxReply(selectedMessage.id, instructions || customInstructions);
      if (res.draftReply) {
        setReplyText(res.draftReply);
        toastSuccess(dir === 'rtl' ? 'تمت صياغة الرد بنجاح!' : 'AI Reply drafted!');
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to generate draft');
    } finally {
      setIsDrafting(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    setIsSendingReply(true);
    try {
      await api.sendInboxReply(selectedMessage.id, replyText);
      toastSuccess(dir === 'rtl' ? 'تم إرسال الرد بنجاح عبر Gmail!' : 'Reply sent successfully via Gmail!');
      setReplyText('');
      setCustomInstructions('');
    } catch (err: any) {
      toastError(err.message || 'Failed to send reply');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleTranslate = async (targetLang?: 'ar' | 'en') => {
    if (!selectedMessage) return;
    const currentLang = translatedMap[selectedMessage.id]?.targetLang || 'ar';
    const nextLang = targetLang || (currentLang === 'ar' ? 'en' : 'ar');

    setIsTranslating(true);
    try {
      const res = await api.translateInboxMessage(selectedMessage.id, nextLang);
      setTranslatedMap((prev) => ({
        ...prev,
        [selectedMessage.id]: {
          subject: res.translatedSubject,
          body: res.translatedBody,
          targetLang: res.targetLang as 'ar' | 'en',
        },
      }));
      setShowTranslation((prev) => ({ ...prev, [selectedMessage.id]: true }));
      toastSuccess(dir === 'rtl' ? 'تمت ترجمة الرسالة بنجاح بواسطة الذكاء الاصطناعي!' : 'Email translated successfully!');
    } catch (err: any) {
      toastError(err.message || 'Translation failed');
    } finally {
      setIsTranslating(false);
    }
  };

  const handleDeleteEmail = async () => {
    if (!selectedMessage) return;
    if (!window.confirm(dir === 'rtl' ? 'هل أنت متأكد من حذف هذه الرسالة من البريد؟' : 'Are you sure you want to delete this email?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await api.deleteInboxMessage(selectedMessage.id);
      toastSuccess(dir === 'rtl' ? 'تم حذف الرسالة بنجاح' : 'Email deleted successfully');
      setMessages((prev) => prev.filter((m) => m.id !== selectedMessage.id));
      setCounts((prev) => ({ ...prev, all: Math.max(0, prev.all - 1) }));
      setSelectedId(null);
      setSelectedMessage(null);
    } catch (err: any) {
      toastError(err.message || 'Failed to delete message');
    } finally {
      setIsDeleting(false);
    }
  };

  const getCategoryBadge = (cat: EmailCategory) => {
    switch (cat) {
      case 'hr_interview':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
            🎯 {dir === 'rtl' ? 'مقابلة / HR' : 'HR & Interview'}
          </span>
        );
      case 'company_update':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
            🏢 {dir === 'rtl' ? 'تحديث شركة' : 'Company Update'}
          </span>
        );
      case 'direct_reply':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300">
            💬 {dir === 'rtl' ? 'رد مباشر' : 'Direct Reply'}
          </span>
        );
      case 'rejection':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            {dir === 'rtl' ? 'اعتذار مهذب' : 'Polite Rejection'}
          </span>
        );
      case 'job_alert':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
            📢 {dir === 'rtl' ? 'تنبيه وظائف' : 'Job Alert'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            ✉️ {dir === 'rtl' ? 'عام' : 'General'}
          </span>
        );
    }
  };

  const getPriorityIndicator = (priority: EmailPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-1.5 py-0.5 rounded">
            <Flame className="w-3 h-3 text-rose-500 animate-pulse" />
            {dir === 'rtl' ? 'عاجل' : 'Urgent'}
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-1.5 py-0.5 rounded">
            ⚡ {dir === 'rtl' ? 'مهم' : 'High'}
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString(dir === 'rtl' ? 'ar-EG' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString(dir === 'rtl' ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto animate-fade-in pb-10">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-brand-500/20 shrink-0">
              <InboxIcon className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{dir === 'rtl' ? 'صندوق البريد الذكي' : 'Smart AI Inbox'}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-brand-500 text-white shadow-xs">
                  Gemini AI
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                {dir === 'rtl'
                  ? 'مزامنة مباشرة مع Gmail وفلترة ذكية لردود الشركات ومقابلات الـ HR'
                  : 'Live Gmail sync with AI filtering for interview invitations and HR replies'}
              </p>
            </div>
          </div>
        </div>

        {/* Sync & Search Actions */}
        <div className="flex items-center gap-2">
          {lastSyncedTime && (
            <span className="text-[11px] text-slate-400 hidden md:inline">
              {dir === 'rtl' ? `آخر مزامنة: ${lastSyncedTime}` : `Synced at: ${lastSyncedTime}`}
            </span>
          )}
          <Button
            variant="primary"
            size="sm"
            onClick={handleSync}
            isLoading={isSyncing}
            className="shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{dir === 'rtl' ? 'مزامنة البريد الآن' : 'Sync Gmail Now'}</span>
          </Button>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        {/* Category Animated Tabs */}
        <Tabs
          activeId={activeCategory}
          onChange={setActiveCategory}
          layoutId="inboxActiveCategoryTab"
          items={[
            { id: 'all', label: dir === 'rtl' ? 'الكل' : 'All', count: counts.all },
            {
              id: 'hr_interview',
              label: dir === 'rtl' ? '🎯 مقابلات و HR' : '🎯 HR & Interviews',
              count: counts.hr_interview > 0 ? counts.hr_interview : undefined,
            },
            {
              id: 'company_update',
              label: dir === 'rtl' ? '🏢 تحديثات الشركات' : '🏢 Company Updates',
              count: counts.company_update > 0 ? counts.company_update : undefined,
            },
            {
              id: 'direct_reply',
              label: dir === 'rtl' ? '💬 ردود مباشرة' : '💬 Direct Replies',
              count: counts.direct_reply > 0 ? counts.direct_reply : undefined,
            },
            {
              id: 'unread',
              label: dir === 'rtl' ? '✉️ غير مقروء' : '✉️ Unread',
              count: counts.unread > 0 ? counts.unread : undefined,
            },
          ]}
        />

        {/* Search Field */}
        <div className="relative w-full lg:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') loadInbox(activeCategory, searchQuery);
            }}
            placeholder={dir === 'rtl' ? 'بحث بالمرسل، الموضوع، أو الملخص...' : 'Search sender, subject, summary...'}
            className="w-full pl-3 pr-9 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-brand-500/20"
          />
          <button
            onClick={() => loadInbox(activeCategory, searchQuery)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Two-Pane Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[620px]">
        {/* Left Column: Email List (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          {isLoading ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div className="w-8 h-8 border-3 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">{dir === 'rtl' ? 'جاري تحميل الرسائل...' : 'Loading emails...'}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <InboxIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {dir === 'rtl' ? 'لا توجد رسائل في هذا القسم' : 'No messages found in this category'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {dir === 'rtl' ? 'اضغط "مزامنة البريد الآن" لجلب أحدث الإيميلات من Gmail.' : 'Click "Sync Gmail Now" to fetch the latest emails.'}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={handleSync} isLoading={isSyncing}>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{dir === 'rtl' ? 'مزامنة البريد الآن' : 'Sync Now'}</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-2 max-h-[750px] overflow-y-auto pr-1">
              {messages.map((msg) => {
                const isSelected = selectedId === msg.id;
                return (
                  <motion.div
                    key={msg.id}
                    onClick={() => selectEmail(msg)}
                    whileHover={{ scale: 1.008, x: dir === 'rtl' ? -2 : 2 }}
                    whileTap={{ scale: 0.995 }}
                    transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-brand-50/70 dark:bg-brand-950/40 border-brand-300 dark:border-brand-800 shadow-sm ring-1 ring-brand-500/20'
                        : msg.is_read
                        ? 'bg-white dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-white dark:bg-slate-900 border-l-4 border-l-brand-600 border-slate-200/90 dark:border-slate-800 shadow-xs'
                    }`}
                  >
                    {/* Top Row: Sender + Date + Priority */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`text-xs truncate ${
                            !msg.is_read
                              ? 'font-black text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {msg.from_name || msg.from_email}
                        </span>
                        {getPriorityIndicator(msg.ai_priority)}
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono whitespace-nowrap shrink-0">
                        {formatDate(msg.date)}
                      </span>
                    </div>

                    {/* Subject */}
                    <h4
                      className={`text-xs truncate mb-2 ${
                        !msg.is_read
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-medium text-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {msg.subject || '(بدون عنوان)'}
                    </h4>

                    {/* AI Takeaway Banner in Card */}
                    {msg.ai_summary && (
                      <div className="mb-2 p-2 rounded-xl bg-purple-50/80 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex items-start gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-purple-900 dark:text-purple-200 font-medium line-clamp-2 leading-relaxed">
                          {msg.ai_summary}
                        </p>
                      </div>
                    )}

                    {/* Bottom Row: Category Badge */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div>{getCategoryBadge(msg.ai_category)}</div>
                      <span className="text-[10px] text-slate-400 truncate max-w-[140px] font-mono" dir="ltr">
                        {msg.from_email}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Selected Message Details & AI Reply (7 cols) */}
        <div className="lg:col-span-7">
          <AnimatePresence mode="wait">
            {selectedMessage ? (
              <motion.div
                key={selectedMessage.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
              >
                <Card className="p-5 sm:p-6 space-y-5">
              {/* Message Header */}
              <div className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getCategoryBadge(selectedMessage.ai_category)}
                    {getPriorityIndicator(selectedMessage.ai_priority)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-mono">
                      {new Date(selectedMessage.date).toLocaleString(dir === 'rtl' ? 'ar-EG' : 'en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <button
                      type="button"
                      onClick={handleDeleteEmail}
                      disabled={isDeleting}
                      title={dir === 'rtl' ? 'حذف هذه الرسالة من البريد' : 'Delete email'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Subject Line (Translated or Original) */}
                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white leading-snug">
                  {showTranslation[selectedMessage.id] && translatedMap[selectedMessage.id]?.subject
                    ? translatedMap[selectedMessage.id].subject
                    : selectedMessage.subject || '(بدون عنوان)'}
                </h2>

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
                    <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-bold flex items-center justify-center shrink-0 uppercase">
                      {(selectedMessage.from_name || selectedMessage.from_email).slice(0, 1)}
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {selectedMessage.from_name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono" dir="ltr">
                        {selectedMessage.from_email}
                      </p>
                    </div>
                  </div>

                  {/* Translation Control Bar */}
                  <div className="flex items-center gap-2">
                    {translatedMap[selectedMessage.id] ? (
                      <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
                        <button
                          type="button"
                          onClick={() => setShowTranslation((prev) => ({ ...prev, [selectedMessage.id]: false }))}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all text-[11px] ${
                            !showTranslation[selectedMessage.id]
                              ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          🇬🇧 {dir === 'rtl' ? 'الأصل' : 'Original'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTranslation((prev) => ({ ...prev, [selectedMessage.id]: true }))}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 text-[11px] ${
                            showTranslation[selectedMessage.id]
                              ? 'bg-brand-600 text-white shadow-xs'
                              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                          }`}
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>
                            {translatedMap[selectedMessage.id].targetLang === 'ar' ? '🇸🇦 العربية' : '🇬🇧 English'}
                          </span>
                        </button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleTranslate('ar')}
                        isLoading={isTranslating}
                        className="h-7 text-xs font-semibold gap-1.5"
                      >
                        <Languages className="w-3.5 h-3.5 text-brand-600" />
                        <span>{dir === 'rtl' ? 'ترجمة الرسالة إلى العربية' : 'Translate to Arabic'}</span>
                      </Button>
                    )}

                    {/* Switch language translation */}
                    {translatedMap[selectedMessage.id] && (
                      <button
                        type="button"
                        onClick={() =>
                          handleTranslate(translatedMap[selectedMessage.id].targetLang === 'ar' ? 'en' : 'ar')
                        }
                        disabled={isTranslating}
                        className="text-[11px] text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                      >
                        <RefreshCw className={`w-3 h-3 ${isTranslating ? 'animate-spin' : ''}`} />
                        <span>
                          {translatedMap[selectedMessage.id].targetLang === 'ar'
                            ? (dir === 'rtl' ? 'إلى English' : 'to English')
                            : (dir === 'rtl' ? 'إلى العربية' : 'to Arabic')}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Key Takeaway Banner */}
              {selectedMessage.ai_summary && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-brand-500/10 border border-purple-200/80 dark:border-purple-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-purple-900 dark:text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                    <span>{dir === 'rtl' ? 'ملخص الذكاء الاصطناعي (AI Takeaway)' : 'Gemini AI Takeaway'}</span>
                  </div>
                  <p className="text-xs text-purple-950 dark:text-purple-100 leading-relaxed font-medium">
                    {selectedMessage.ai_summary}
                  </p>
                </div>
              )}

              {/* Email Content Body (Translated or Original) */}
              <div
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 overflow-x-auto max-h-[350px] overflow-y-auto leading-relaxed"
                dir={showTranslation[selectedMessage.id] && translatedMap[selectedMessage.id]?.targetLang === 'ar' ? 'rtl' : 'ltr'}
              >
                {showTranslation[selectedMessage.id] && translatedMap[selectedMessage.id]?.body ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: translatedMap[selectedMessage.id].body }}
                    className="prose prose-xs dark:prose-invert max-w-none break-words"
                  />
                ) : selectedMessage.body_html ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedMessage.body_html }}
                    className="prose prose-xs dark:prose-invert max-w-none break-words"
                  />
                ) : (
                  <pre className="font-sans whitespace-pre-wrap break-words">
                    {selectedMessage.body_text || selectedMessage.snippet}
                  </pre>
                )}
              </div>

              {/* Quick AI Reply Composer */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white">
                      {dir === 'rtl' ? 'الرد الذكي السريع (AI Smart Reply)' : 'AI Smart Reply'}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDraftReply('قبول الدعوة وإظهار الحماس وتأكيد التفرغ')}
                      isLoading={isDrafting}
                      className="text-[11px] h-7 px-2"
                    >
                      🎯 {dir === 'rtl' ? 'قبول مقابلة' : 'Accept Interview'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDraftReply('شكرهم على التحديث والاستفسار عن الخطوات القادمة')}
                      isLoading={isDrafting}
                      className="text-[11px] h-7 px-2"
                    >
                      💬 {dir === 'rtl' ? 'متابعة الخطوات' : 'Next Steps'}
                    </Button>
                  </div>
                </div>

                {/* Custom Instruction Box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleDraftReply();
                    }}
                    placeholder={
                      dir === 'rtl'
                        ? 'تعليمات مخصصة (مثلاً: حدد ميعاد مناسب يوم الأربعاء الساعة 3)...'
                        : 'Custom instructions for AI (e.g. mention Wednesday 3 PM availability)...'
                    }
                    className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDraftReply()}
                    isLoading={isDrafting}
                    className="shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    <span>{dir === 'rtl' ? 'صياغة' : 'Draft'}</span>
                  </Button>
                </div>

                {/* Reply Textarea */}
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={
                    dir === 'rtl'
                      ? 'اكتب ردك هنا أو استخدم المقترحات بالأعلى لإنشاء رد بضغطة زر...'
                      : 'Write your reply or use the quick buttons above to generate a draft...'
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-sans leading-relaxed focus:ring-2 focus:ring-brand-500/20"
                  dir="ltr"
                />

                {/* Action Buttons */}
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {dir === 'rtl'
                      ? `سيتم الإرسال من: alaayasser2018@gmail.com إلى: ${selectedMessage.from_email}`
                      : `Sending via: alaayasser2018@gmail.com to: ${selectedMessage.from_email}`}
                  </span>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleSendReply}
                    isLoading={isSendingReply}
                    disabled={!replyText.trim()}
                    className="shadow-md shadow-brand-500/20"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{dir === 'rtl' ? 'إرسال الرد الآن' : 'Send Reply Now'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="empty-inbox-detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="p-12 text-center text-slate-400 space-y-2 border-dashed">
              <Mail className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700" />
              <p className="text-sm font-semibold">
                {dir === 'rtl' ? 'اختر رسالة من القائمة لعرضها' : 'Select an email to view'}
              </p>
              <p className="text-xs text-slate-400">
                {dir === 'rtl'
                  ? 'ستتمكن من قراءة الرسالة، رؤية ملخص الـ AI بالعربية، وصياغة رد بضغطة زر.'
                  : 'You can read full details, see the AI Arabic summary, and 1-click send replies.'}
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
      </div>
    </div>
  );
};
export default Inbox;

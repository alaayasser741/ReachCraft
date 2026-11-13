import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FileCheck2,
  AlertTriangle,
  Mail,
  MessageSquare,
  Search,
  ExternalLink,
  Edit2,
  Save,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { ParsedCompany, ParseResult } from '../types';

export const ReviewData: React.FC = () => {
  const { fileId } = useParams<{ fileId?: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [isLoading, setIsLoading] = useState(true);
  const [activeFileId, setActiveFileId] = useState<number | null>(null);
  const [filename, setFilename] = useState<string>('Extracted Data');
  const [companies, setCompanies] = useState<ParsedCompany[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'email' | 'whatsapp' | 'warning' | 'no_contact'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Edit Drawer state
  const [editingCompany, setEditingCompany] = useState<ParsedCompany | null>(null);

  useEffect(() => {
    loadData();
  }, [fileId]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      let targetId: number | null = fileId ? parseInt(fileId, 10) : null;

      if (!targetId) {
        const filesRes = await api.getFiles();
        if (filesRes.files.length > 0) {
          targetId = filesRes.files[0].id;
        }
      }

      if (!targetId) {
        setIsLoading(false);
        return;
      }

      setActiveFileId(targetId);
      const res = await api.getFile(targetId);

      if (res.file.parseResult) {
        const pr: ParseResult = res.file.parseResult;
        setFilename(res.file.original_name);
        setCompanies(pr.companies);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to load parsed data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleExclude = (companyId: string) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, isExcluded: !c.isExcluded } : c))
    );
  };

  const handleInlineCompanyChange = (companyId: string, field: keyof ParsedCompany, val: any) => {
    setCompanies((prev) =>
      prev.map((c) => (c.id === companyId ? { ...c, [field]: val } : c))
    );
  };

  const handleInlineContactChange = (companyId: string, contactIndex: number, field: string, val: any) => {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== companyId) return c;
        const newContacts = [...c.contacts];
        if (newContacts[contactIndex]) {
          newContacts[contactIndex] = { ...newContacts[contactIndex], [field]: val };
        }
        return { ...c, contacts: newContacts };
      })
    );
  };

  const handleConfirmSave = async () => {
    if (!activeFileId) return;
    setIsSaving(true);

    try {
      const activeToSave = companies.filter((c) => !c.isExcluded);
      const res = await api.confirmFileData(activeFileId, activeToSave);
      toastSuccess(`Saved ${res.savedCompaniesCount} companies & ${res.savedContactsCount} contacts into database!`);
      navigate('/contacts');
    } catch (err: any) {
      toastError(err.message || 'Failed to save reviewed data');
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered companies
  const filteredCompanies = companies.filter((comp) => {
    const matchSearch =
      searchQuery === '' ||
      comp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (comp.website && comp.website.toLowerCase().includes(searchQuery.toLowerCase())) ||
      comp.contacts.some(
        (ct) =>
          (ct.personName && ct.personName.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (ct.email && ct.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
          (ct.phoneMobile && ct.phoneMobile.includes(searchQuery))
      );

    if (!matchSearch) return false;

    if (activeFilter === 'email') return comp.contacts.some((ct) => Boolean(ct.email));
    if (activeFilter === 'whatsapp') return comp.contacts.some((ct) => Boolean(ct.phoneMobile || ct.whatsappNumber));
    if (activeFilter === 'warning') return comp.anomalies.length > 0;
    if (activeFilter === 'no_contact') return !comp.hasDirectContact;

    return true;
  });

  const totalCount = companies.length;
  const withEmailCount = companies.filter((c) => c.contacts.some((ct) => ct.email)).length;
  const withWhatsAppCount = companies.filter((c) => c.contacts.some((ct) => ct.whatsappNumber || ct.phoneMobile)).length;
  const withAnomaliesCount = companies.filter((c) => c.anomalies.length > 0).length;
  const noContactCount = companies.filter((c) => !c.hasDirectContact).length;
  const excludedCount = companies.filter((c) => c.isExcluded).length;
  const activeSaveCount = totalCount - excludedCount;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-3">
        <div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className="text-center py-16 max-w-md mx-auto space-y-4">
        <FileCheck2 className="w-12 h-12 text-slate-300 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          {t('review.noStagedData')}
        </h2>
        <p className="text-xs text-slate-500">{t('review.noStagedDataDesc')}</p>
        <Button variant="primary" onClick={() => navigate('/upload')}>
          {t('review.goToUpload')}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-7xl mx-auto animate-fade-in" dir={dir}>
      {/* Title & Stats Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {t('review.title')}
            </h1>
            <Badge variant="brand" size="sm">
              {filename}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">{t('review.subtitle')}</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="md"
            isLoading={isSaving}
            onClick={handleConfirmSave}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {t('review.importToDb', { count: activeSaveCount })}
          </Button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('review.all', { count: totalCount })}
          </button>
          <button
            onClick={() => setActiveFilter('email')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === 'email'
                ? 'bg-brand-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>{t('review.hasEmail', { count: withEmailCount })}</span>
          </button>
          <button
            onClick={() => setActiveFilter('whatsapp')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === 'whatsapp'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{t('review.whatsappReady', { count: withWhatsAppCount })}</span>
          </button>
          <button
            onClick={() => setActiveFilter('warning')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeFilter === 'warning'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{t('review.anomaliesFlags', { count: withAnomaliesCount })}</span>
          </button>
          <button
            onClick={() => setActiveFilter('no_contact')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              activeFilter === 'no_contact'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
            }`}
          >
            {t('review.boothOnly', { count: noContactCount })}
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search
            className={`w-4 h-4 text-slate-400 absolute ${
              dir === 'rtl' ? 'right-3' : 'left-3'
            } top-1/2 -translate-y-1/2`}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('review.searchPlaceholder')}
            className={`w-full ${
              dir === 'rtl' ? 'pr-9 pl-3' : 'pl-9 pr-3'
            } py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500`}
          />
        </div>
      </Card>

      {/* Main Review Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4 w-12 text-center">{t('review.colStatus')}</th>
                <th className="py-3 px-4 w-16">{t('review.colNumber')}</th>
                <th className="py-3 px-4 min-w-[200px]">{t('review.colCompany')}</th>
                <th className="py-3 px-4 min-w-[160px]">{t('review.colContact')}</th>
                <th className="py-3 px-4 min-w-[200px]">{t('review.colEmail')}</th>
                <th className="py-3 px-4 min-w-[170px]">{t('review.colPhone')}</th>
                <th className="py-3 px-4 min-w-[220px]">{t('review.colFlags')}</th>
                <th className="py-3 px-4 text-right w-20">{t('review.colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
              {filteredCompanies.map((company) => {
                const primaryContact = company.contacts[0] || null;

                return (
                  <tr
                    key={company.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40 ${
                      company.isExcluded ? 'opacity-40 bg-slate-100/50 dark:bg-slate-900/50' : ''
                    }`}
                  >
                    {/* Include/Exclude Toggle Checkbox */}
                    <td className="py-3 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={!company.isExcluded}
                        onChange={() => handleToggleExclude(company.id!)}
                        title={
                          company.isExcluded
                            ? t('review.clickToInclude')
                            : t('review.clickToExclude')
                        }
                        className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 cursor-pointer w-4 h-4"
                      />
                    </td>

                    {/* Heading Number */}
                    <td className="py-3 px-4 text-slate-400 font-mono">
                      {company.headingNumber || '-'}
                    </td>

                    {/* Company Name & Link */}
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <input
                          type="text"
                          value={company.name}
                          onChange={(e) =>
                            handleInlineCompanyChange(company.id!, 'name', e.target.value)
                          }
                          className="font-bold text-slate-900 dark:text-white bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent focus:border-brand-500 w-full"
                        />
                        {company.website && (
                          <a
                            href={company.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-brand-600 transition-colors"
                          >
                            <span className="truncate max-w-[180px]">
                              {company.website.replace(/^https?:\/\//i, '')}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Contact Person & Job Title */}
                    <td className="py-3 px-4">
                      {primaryContact ? (
                        <div className="space-y-0.5">
                          <input
                            type="text"
                            value={primaryContact.personName || ''}
                            onChange={(e) =>
                              handleInlineContactChange(
                                company.id!,
                                0,
                                'personName',
                                e.target.value
                              )
                            }
                            className="font-semibold text-slate-800 dark:text-slate-200 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent focus:border-brand-500 w-full"
                          />
                          <input
                            type="text"
                            value={primaryContact.jobTitle || ''}
                            onChange={(e) =>
                              handleInlineContactChange(
                                company.id!,
                                0,
                                'jobTitle',
                                e.target.value
                              )
                            }
                            className="text-[11px] text-slate-400 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent focus:border-brand-500 w-full"
                          />
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">{t('common.none')}</span>
                      )}
                    </td>

                    {/* Email Address */}
                    <td className="py-3 px-4">
                      {primaryContact ? (
                        <div className="space-y-1">
                          <input
                            type="email"
                            value={primaryContact.email || ''}
                            onChange={(e) =>
                              handleInlineContactChange(company.id!, 0, 'email', e.target.value)
                            }
                            className="font-mono text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent focus:border-brand-500 w-full"
                          />
                          {primaryContact.email && (
                            <Badge
                              variant={primaryContact.isValidEmail ? 'success' : 'danger'}
                              size="sm"
                            >
                              {primaryContact.isValidEmail
                                ? t('review.validEmail')
                                : t('review.checkSyntax')}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">{t('common.none')}</span>
                      )}
                    </td>

                    {/* Mobile Phone / WhatsApp */}
                    <td className="py-3 px-4">
                      {primaryContact &&
                      (primaryContact.phoneMobile || primaryContact.phoneLandline) ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={primaryContact.phoneMobile || primaryContact.phoneLandline || ''}
                            onChange={(e) =>
                              handleInlineContactChange(
                                company.id!,
                                0,
                                'phoneMobile',
                                e.target.value
                              )
                            }
                            className="font-mono text-slate-700 dark:text-slate-300 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 focus:bg-white dark:focus:bg-slate-800 px-1.5 py-0.5 rounded border border-transparent focus:border-brand-500 w-full"
                          />
                          {primaryContact.phoneMobile ? (
                            <Badge variant="emerald" size="sm">
                              {t('review.whatsappCandidate')}
                            </Badge>
                          ) : (
                            <Badge variant="slate" size="sm">
                              {t('review.landline')}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">{t('common.none')}</span>
                      )}
                    </td>

                    {/* Anomalies & Flags */}
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {!company.hasDirectContact && (
                          <Badge variant="slate" size="sm">
                            {t('review.noDirectContact')}
                          </Badge>
                        )}
                        {company.anomalies.map((anom, idx) => (
                          <Badge
                            key={idx}
                            variant={anom.toLowerCase().includes('typo') ? 'danger' : 'warning'}
                            size="sm"
                          >
                            {anom}
                          </Badge>
                        ))}
                      </div>
                    </td>

                    {/* Action: Open Drawer */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setEditingCompany(company)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={t('review.editFullDossier')}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 py-3.5 px-4 sm:px-8 shadow-2xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs">
            <span className="font-bold text-slate-900 dark:text-white">
              {t('review.readyToImport', { active: activeSaveCount, total: totalCount })}
            </span>
            {excludedCount > 0 && (
              <span className="text-rose-600 dark:text-rose-400 font-medium">
                {t('review.excludedCount', { count: excludedCount })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCompanies((prev) => prev.map((c) => ({ ...c, isExcluded: false })))}
            >
              {t('review.includeAll')}
            </Button>
            <Button
              variant="primary"
              size="md"
              isLoading={isSaving}
              onClick={handleConfirmSave}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {t('review.confirmSave')}
            </Button>
          </div>
        </div>
      </div>

      {/* Slide-over Drawer for Full Dossier Editing */}
      {editingCompany && (
        <Drawer
          isOpen={Boolean(editingCompany)}
          onClose={() => setEditingCompany(null)}
          title={t('review.editCompanyTitle', { name: editingCompany.name })}
          subtitle={`Heading #${editingCompany.headingNumber || '-'}`}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('review.companyNameLabel')}
              </label>
              <input
                type="text"
                value={editingCompany.name}
                onChange={(e) =>
                  setEditingCompany({ ...editingCompany, name: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('review.websiteLabel')}
              </label>
              <input
                type="text"
                value={editingCompany.website || ''}
                onChange={(e) =>
                  setEditingCompany({ ...editingCompany, website: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('review.descriptionLabel')}
              </label>
              <textarea
                rows={3}
                value={editingCompany.description || ''}
                onChange={(e) =>
                  setEditingCompany({ ...editingCompany, description: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                {t('review.addressLabel')}
              </label>
              <textarea
                rows={2}
                value={editingCompany.address || ''}
                onChange={(e) =>
                  setEditingCompany({ ...editingCompany, address: e.target.value })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  setCompanies((prev) =>
                    prev.map((c) => (c.id === editingCompany.id ? editingCompany : c))
                  );
                  setEditingCompany(null);
                  toastSuccess('Updated company');
                }}
              >
                {t('review.applyChanges')}
              </Button>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

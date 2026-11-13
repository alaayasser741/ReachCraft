import React, { useEffect, useState } from 'react';
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
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Drawer } from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { Company, Contact } from '../types';

export const CompaniesContacts: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const { t, dir } = useTranslation();

  const [activeTab, setActiveTab] = useState<'contacts' | 'companies'>('contacts');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [hasEmailFilter, setHasEmailFilter] = useState<boolean | undefined>(undefined);
  const [hasWhatsAppFilter, setHasWhatsAppFilter] = useState<boolean | undefined>(undefined);
  const [optedOutFilter, setOptedOutFilter] = useState<boolean | undefined>(undefined);

  // Selected for drawer
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab, hasEmailFilter, hasWhatsAppFilter, optedOutFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'contacts') {
        const res = await api.getContacts({
          search: searchQuery || undefined,
          hasEmail: hasEmailFilter,
          hasWhatsApp: hasWhatsAppFilter,
          optedOut: optedOutFilter,
        });
        setContacts(res.contacts);
      } else {
        const res = await api.getCompanies({
          search: searchQuery || undefined,
        });
        setCompanies(res.companies);
      }
    } catch (err: any) {
      toastError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
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

      {/* Tabs & Search Filter Card */}
      <Card className="p-4 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          {/* Main Switcher Tabs */}
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button
              onClick={() => setActiveTab('contacts')}
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
              onClick={() => setActiveTab('companies')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'companies'
                  ? 'bg-white dark:bg-slate-900 text-brand-700 dark:text-brand-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>{t('contacts.companiesView')}</span>
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search
              className={`w-4 h-4 text-slate-400 absolute ${
                dir === 'rtl' ? 'right-3' : 'left-3'
              } top-1/2 -translate-y-1/2`}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'contacts'
                  ? t('contacts.searchPlaceholderContacts')
                  : t('contacts.searchPlaceholderCompanies')
              }
              className={`w-full ${
                dir === 'rtl' ? 'pr-9 pl-4' : 'pl-9 pr-4'
              } py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500`}
            />
          </form>
        </div>

        {/* Contacts Filter Pills (Visible in contacts tab) */}
        {activeTab === 'contacts' && (
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-slate-400 font-semibold uppercase text-[11px] mr-1">
              {t('common.status')}:
            </span>
            <button
              onClick={() => {
                setHasEmailFilter(undefined);
                setHasWhatsAppFilter(undefined);
                setOptedOutFilter(undefined);
              }}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${
                hasEmailFilter === undefined &&
                hasWhatsAppFilter === undefined &&
                optedOutFilter === undefined
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              {t('contacts.allContacts')}
            </button>
            <button
              onClick={() => setHasEmailFilter(hasEmailFilter === true ? undefined : true)}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                hasEmailFilter === true
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <Mail className="w-3 h-3" />
              <span>{t('contacts.hasEmailFilter')}</span>
            </button>
            <button
              onClick={() => setHasWhatsAppFilter(hasWhatsAppFilter === true ? undefined : true)}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                hasWhatsAppFilter === true
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <MessageSquare className="w-3 h-3" />
              <span>{t('contacts.hasWhatsAppFilter')}</span>
            </button>
            <button
              onClick={() => setOptedOutFilter(optedOutFilter === true ? undefined : true)}
              className={`px-3 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-all ${
                optedOutFilter === true
                  ? 'bg-rose-600 text-white'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              <ShieldAlert className="w-3 h-3" />
              <span>{t('contacts.optedOutFilter')}</span>
            </button>
          </div>
        )}
      </Card>

      {/* Main Content Table */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-slate-400 mt-2">{t('common.loading')}</p>
        </div>
      ) : activeTab === 'contacts' ? (
        /* Contacts Table */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">{t('contacts.colPerson')}</th>
                  <th className="py-3 px-4">{t('contacts.colCompany')}</th>
                  <th className="py-3 px-4">{t('contacts.colEmail')}</th>
                  <th className="py-3 px-4">{t('contacts.colPhone')}</th>
                  <th className="py-3 px-4">{t('contacts.colConsent')}</th>
                  <th className="py-3 px-4 text-right">{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      {t('contacts.noContactsMatch')}
                    </td>
                  </tr>
                ) : (
                  contacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {contact.person_name || t('contacts.anonymousContact')}
                        </div>
                        {contact.job_title && (
                          <div className="text-[11px] text-slate-400">{contact.job_title}</div>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                        {contact.company_name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {contact.email ? (
                          <div className="flex items-center gap-1.5">
                            <span>{contact.email}</span>
                            <Badge variant={contact.is_valid_email ? 'success' : 'danger'} size="sm">
                              {contact.is_valid_email ? t('common.valid') : t('common.invalid')}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t('common.none')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {contact.whatsapp_number || contact.phone_mobile ? (
                          <div className="flex items-center gap-1.5">
                            <span>{contact.whatsapp_number || contact.phone_mobile}</span>
                            <Badge variant="emerald" size="sm">
                              WhatsApp
                            </Badge>
                          </div>
                        ) : contact.phone_landline ? (
                          <div className="flex items-center gap-1.5">
                            <span>{contact.phone_landline}</span>
                            <Badge variant="slate" size="sm">
                              {t('review.landline')}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">{t('common.none')}</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {contact.opted_out === 1 ? (
                          <Badge variant="danger" size="sm" icon={<ShieldAlert className="w-3 h-3" />}>
                            {t('contacts.optedOut')}
                          </Badge>
                        ) : (
                          <Badge variant="brand" size="sm" icon={<ShieldCheck className="w-3 h-3" />}>
                            {t('contacts.subscribed')}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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

            {selectedCompany.links && selectedCompany.links.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  {t('contacts.discoveredLinks')}
                </h4>
                <div className="space-y-1.5">
                  {selectedCompany.links.map((l: any, i: number) => (
                    <a
                      key={i}
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-xs text-brand-600 transition-colors"
                    >
                      <span className="capitalize font-semibold">{l.type}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {t('contacts.associatedContacts', { count: selectedCompany.contacts?.length || 0 })}
              </h4>
              <div className="space-y-2">
                {selectedCompany.contacts?.map((ct: any) => (
                  <div
                    key={ct.id}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-1"
                  >
                    <div className="font-bold text-slate-900 dark:text-white">
                      {ct.person_name || t('contacts.anonymousContact')}{' '}
                      {ct.job_title && `(${ct.job_title})`}
                    </div>
                    {ct.email && <div className="text-slate-600 dark:text-slate-300">✉ {ct.email}</div>}
                    {ct.phone_mobile && (
                      <div className="text-slate-600 dark:text-slate-300">📱 {ct.phone_mobile}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

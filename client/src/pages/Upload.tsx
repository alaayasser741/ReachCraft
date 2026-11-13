import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { useTranslation } from '../i18n/LanguageContext';
import { api } from '../services/api';
import { ParseResult } from '../types';

export const Upload: React.FC = () => {
  const navigate = useNavigate();
  const { error: toastError, success: toastSuccess } = useToast();
  const { t, dir } = useTranslation();

  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<number | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);

  useEffect(() => {
    loadFilesHistory();
  }, []);

  const loadFilesHistory = () => {
    api
      .getFiles()
      .then((res) => setUploadedFiles(res.files))
      .catch((err) => console.error('Files history load error:', err));
  };

  const handleFileProcess = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toastError(t('upload.sizeExceeded'));
      return;
    }

    setIsUploading(true);
    setUploadProgress(20);

    try {
      const interval = setInterval(() => {
        setUploadProgress((prev) => (prev < 85 ? prev + 15 : prev));
      }, 200);

      const res = await api.uploadFile(file);
      clearInterval(interval);
      setUploadProgress(100);

      setUploadedFileId(res.fileId);
      setParseResult(res.parseResult);
      toastSuccess(
        t('upload.extractionStats', {
          companies: res.parseResult.totalCompanies,
          emails: res.parseResult.contactsWithEmail,
          whatsapps: res.parseResult.contactsWithWhatsApp,
          noContact: res.parseResult.companiesNoDirectContact,
        })
      );
      loadFilesHistory();
    } catch (err: any) {
      toastError(err.message || 'File parsing failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileProcess(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in" dir={dir}>
      {/* Page Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          {t('upload.title')}
        </h1>
        <p className="text-sm text-slate-500 mt-1">{t('upload.subtitle')}</p>
      </div>

      {/* Main Drag & Drop Zone */}
      <Card className="p-8 sm:p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-brand-500 transition-all text-center relative overflow-hidden">
        <input
          type="file"
          id="fileUploadInput"
          accept=".pdf,.csv,.xlsx,.xls"
          onChange={handleInputChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
          onDragEnter={() => setDragActive(true)}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          disabled={isUploading}
        />

        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 flex items-center justify-center mx-auto shadow-inner">
            {isUploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {dragActive ? t('upload.dragDropActive') : t('upload.dragDropTitle')}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{t('upload.supportedFormats')}</p>
          </div>

          {isUploading && (
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}

          <div className="pt-2 flex justify-center gap-3">
            <Button size="md" variant="primary" disabled={isUploading}>
              {t('upload.browseFiles')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Parse Preview Card if just parsed */}
      {parseResult && uploadedFileId && (
        <Card className="p-6 border-brand-200 dark:border-brand-900 bg-brand-50/30 dark:bg-brand-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {t('upload.extractionComplete', { filename: parseResult.filename })}
                </h3>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {t('upload.extractionStats', {
                  companies: parseResult.totalCompanies,
                  emails: parseResult.contactsWithEmail,
                  whatsapps: parseResult.contactsWithWhatsApp,
                  noContact: parseResult.companiesNoDirectContact,
                })}
              </p>
            </div>

            <Button
              size="md"
              variant="primary"
              rightIcon={<ArrowRight className={`w-4 h-4 ${dir === 'rtl' ? 'rotate-180' : ''}`} />}
              onClick={() => navigate(`/review/${uploadedFileId}`)}
            >
              {t('upload.openReviewStudio')}
            </Button>
          </div>
        </Card>
      )}

      {/* Uploaded Files History */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          {t('upload.uploadedRecords')}
        </h3>
        {uploadedFiles.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">{t('upload.noFiles')}</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {uploadedFiles.map((file) => (
              <Card key={file.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                    {file.file_type === 'pdf' ? (
                      <FileText className="w-5 h-5 text-rose-500" />
                    ) : (
                      <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {file.original_name}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {t('upload.companiesCount', { count: file.parsed_count })} •{' '}
                      {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Badge variant={file.status === 'confirmed' ? 'success' : 'brand'} size="sm">
                    {file.status}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/review/${file.id}`)}
                  >
                    {t('upload.reviewData')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

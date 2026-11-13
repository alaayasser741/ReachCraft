import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { X } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext';

export const Layout: React.FC<{ title?: string }> = ({ title }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { dir } = useTranslation();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden" dir={dir}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* Mobile Drawer Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div
            className={`relative w-64 max-w-[80vw] bg-white dark:bg-slate-900 h-full z-10 shadow-2xl flex flex-col ${
              dir === 'rtl' ? 'mr-0' : 'ml-0'
            }`}
          >
            <div className={`absolute top-4 ${dir === 'rtl' ? 'left-4' : 'right-4'} z-20`}>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onCloseMobile={() => setMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

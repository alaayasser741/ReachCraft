import React, { useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingFeatures } from '../components/landing/LandingFeatures';
import { LandingLab } from '../components/landing/LandingLab';
import { LandingAntiBan } from '../components/landing/LandingAntiBan';
import { LandingDeveloper } from '../components/landing/LandingDeveloper';
import { LandingTechStack } from '../components/landing/LandingTechStack';
import { LandingFaq } from '../components/landing/LandingFaq';
import { LandingCta } from '../components/landing/LandingCta';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  const { dir } = useTranslation();

  // Scroll to top on fresh load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div
      className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 selection:bg-brand-500 selection:text-white"
      dir={dir}
    >
      {/* 1. Sleek Floating Pill Navbar with Fixed Responsive Mobile Drawer */}
      <LandingNavbar />

      {/* Main Semantic Landmark */}
      <main id="main-content">
        {/* 2. Hero Section with Distinct Human-Crafted Architectural Background */}
        <LandingHero />

        {/* 3. Features Section (المميزات) - Placed directly after Hero */}
        <LandingFeatures />

        {/* 4. Interactive Outreach Laboratory & Live Pipeline (كيف يعمل والمعمل التفاعلي) */}
        <LandingLab />

        {/* 5. Anti-Ban Safety Architecture (مكافحة الحظر وحماية الإرسال) */}
        <LandingAntiBan />

        {/* 6. Lead Developer & Creator Profile (علاء عبدالله - CV, Projects, Experience) */}
        <LandingDeveloper />

        {/* 7. Open-Source Free-Tier Tech Stack (التقنيات والتكلفة $0) */}
        <LandingTechStack />

        {/* 8. Frequently Asked Questions (الأسئلة الشائعة) */}
        <LandingFaq />

        {/* 9. Bottom High-Converting Action Banner */}
        <LandingCta />
      </main>

      {/* 10. Footer */}
      <LandingFooter />
    </div>
  );
};

export default LandingPage;

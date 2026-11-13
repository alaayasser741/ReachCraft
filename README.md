# 🚀 ReachCraft

> **Open-Source AI-Powered Outreach, Lead Intelligence & Smart Inbox Operating System**  
> *Zero-cost infrastructure • 100% Free Stack • Privacy-First • Bilingual Arabic (RTL) & English (LTR)*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-22%2B%20%7C%2024%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-3.5_Flash_Lite-8E75B2?logo=google&logoColor=white)](https://aistudio.google.com)
[![SQLite](https://img.shields.io/badge/SQLite-WAL_Mode-003B57?logo=sqlite&logoColor=white)](https://sqlite.org)

---

## 📖 Overview

**ReachCraft** is a production-grade, open-source outbound sales and career outreach platform built to eliminate paid SaaS subscriptions (like Apollo, Instantly, Lemlist, or Mailshake). It is designed for software engineers, freelancers, founders, agency owners, and SDRs who want end-to-end control over their data, outreach delivery, and candidate pipelines.

ReachCraft unifies lead extraction from complex unstructured directories (PDFs, CSV, Excel), data cleaning and phone/email verification, jittered campaign dispatching, **Gemini 3.5 AI Spam Guardian**, and a **built-in Smart AI Inbox** with live Gmail IMAP synchronization and intelligent classification for HR and interview invitations.

---

## ✨ Key Capabilities & Features

### 1. 📬 Smart AI Inbox (صندوق البريد الذكي)
- **Live Gmail IMAP Sync**: Connects directly to Gmail via secure IMAP (`imapflow` & `mailparser`) without switching tabs or logging into third-party portals.
- **Gemini AI Categorization**: Automatically filters incoming mail into:
  - 🎯 **HR & Interview Invitations (`hr_interview`)**: Highlights recruiters, talent acquisition leads, and interview schedulers.
  - 🏢 **Company Updates (`company_update`)**: Application progress, take-home assignments, and status updates.
  - 💬 **Direct Human Replies (`direct_reply`)**: Conversations resulting from cold outreach.
  - 📢 **Job Alerts & Newsletters (`job_alert` / `general`)**: Automated job board alerts sorted with low priority.
- **Arabic 1-Sentence Takeaways (✨ ملخص فوري بالعربية)**: Generates a crystal-clear one-sentence Arabic summary displayed directly on the email card and preview panel so you know exactly what is required in 2 seconds.
- **1-Click AI Reply Composer**: Gemini drafts tailored professional responses matching your profile and credentials with 1-click dispatching back through Gmail SMTP.

### 2. 🧠 Google Gemini 3.5 AI Intelligence Suite
- **AI Spam Guardian & Deliverability Scorer**: Scores subject lines and email copy on a 0–100 scale, identifies spam triggers, and provides **1-Click Auto-Fix & Rephrase** achieving 95%+ inbox placement with full undo support.
- **Context-Aware Dynamic Personalization**: Tailors pitch emails per company and role using website context, tech stacks, and company descriptions.
- **Smart Subject Line Generator**: Proposes 3 high-converting, curiosity-driven subject lines for every template.

### 3. 🛡️ Circuit Breaker & Safety Engine
- **Gmail Account Protection**: Detects SMTP rate limits (`421`), quota caps (`550`), authentication errors (`535`), and spam blocks (`554`), pausing campaigns automatically after consecutive anomalies to protect domain reputation.
- **Human Pacing & Jitter**: Randomizes sending intervals (20–35s for email, 30–90s for WhatsApp) with configurable daily caps.
- **One-Click Unsubscribe Engine**: Cryptographic token-based unsubscribe handler automatically excluding recipients from all future blasts.

### 4. 📄 Multi-Format Exhibition & Lead Parser
- **Unstructured PDF Parsing**: Splits directory books, exhibitor catalogs (e.g. Cairo ICT, Gitex), and multi-column tables.
- **Phone Normalization**: Standardizes E.164 formats, validates Egypt (`+20`) and international numbers, and classifies mobile vs. landline numbers.
- **Interactive Review Studio**: Inline table editing, anomaly inspection, and single-click staging into SQLite.

### 5. 🎨 Design & Accessibility
- **Modern Night Mode & Clean Light Mode**: Tailored dark theme optimized for long hours.
- **Native Arabic RTL & English LTR**: Built-in language switch with typography powered by Google Sans and Cairo.
- **Direct Send Modal**: Fast 1-to-1 personalized email outreach without needing to create a file or bulk campaign.

---

## 🛠️ Architecture & Tech Stack (100% Free & Open-Source)

| Layer | Technology | Purpose & Guarantee |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript, Tailwind CSS, Lucide | Ultra-responsive SPA, zero build overhead |
| **Backend** | Node.js 22+/24+, Express, TypeScript, Zod | Fast ESM backend with strict runtime validation |
| **Database** | Node.js native `node:sqlite` (DatabaseSync) | Zero external database servers, WAL mode, ACID transactions |
| **Email Protocol** | Nodemailer (SMTP) + ImapFlow (IMAP) | Connects to free Gmail App Password (500 emails/day) |
| **AI Intelligence** | Google Gemini 3.5 Flash Lite (`@google/genai`) | High-speed structured JSON generation (<1s latency) |
| **Parser Engine** | `pdf-parse`, `xlsx`, `csv-parse`, `libphonenumber-js` | Offline document parsing & phone normalization |

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: `v20.0.0` or higher (Recommended: `v22.x` or `v24.x`)
- **npm**: `v9.0.0` or higher
- **Gmail Account**: Free Gmail account with 2-Step Verification enabled.
- **Google AI Studio API Key**: Free Gemini API Key from [Google AI Studio](https://aistudio.google.com).

### 2. Installation

```bash
# 1. Clone the repository
git clone https://github.com/alaayasser741/ReachCraft.git
cd ReachCraft

# 2. Install root dependencies and workspaces
npm install
npm run install:all
```

### 3. Environment Configuration

Copy the sample environment file to `.env`:

```bash
cp .env.example .env
```

Update your `.env` configuration:

```env
# Server
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Admin Credentials
ADMIN_EMAIL=admin@outreach.local
ADMIN_PASSWORD=adminStrongPass2026!
JWT_SECRET=your_super_secret_jwt_key_at_least_32_characters_long_2026

# Database
DATABASE_PATH=./data/outreach.db

# Email Configuration (Gmail App Password)
EMAIL_PROVIDER=gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx-xxxx-xxxx-xxxx
SMTP_FROM_NAME=Your Name
SMTP_FROM_EMAIL=your-email@gmail.com
EMAIL_DAILY_CAP=100
EMAIL_MIN_INTERVAL_SEC=20
EMAIL_MAX_INTERVAL_SEC=35

# Google Gemini AI Studio (Free Tier)
GEMINI_API_KEY=your-google-studio-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
```

#### How to generate a free Gmail App Password:
1. Go to your [Google Account Security Settings](https://myaccount.google.com/security).
2. Ensure **2-Step Verification** is turned **ON**.
3. Visit [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
4. Create an app named **"ReachCraft"** and copy the 16-character password into `SMTP_PASS`.

### 4. Running the Development Servers

Start both frontend and backend concurrently:

```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **Default Login**: `admin@outreach.local` / `adminStrongPass2026!`

---

## 🧪 Testing & Verification

Run the comprehensive unit and integration test suite:

```bash
npm test
```

Build client and server for production deployment:

```bash
npm run build
```

---

## 📁 Repository Structure

```text
ReachCraft/
├── client/                     # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/         # UI component library, Layout, Modals, Toasts
│   │   ├── hooks/              # useAuth, useTheme, custom hooks
│   │   ├── i18n/               # Arabic (RTL) & English (LTR) dictionaries
│   │   ├── pages/              # Dashboard, Inbox, Upload, Review, Contacts, Templates, Campaigns, Settings
│   │   ├── services/           # Typed API Client
│   │   └── types/              # Domain TypeScript interfaces
│   └── package.json
│
├── server/                     # Node.js + Express Backend API
│   ├── fixtures/               # Test fixtures (sample catalogs)
│   ├── src/
│   │   ├── config/             # Environment validation with Zod
│   │   ├── db/                 # SQLite connection & migrations (node:sqlite)
│   │   ├── middlewares/        # Auth JWT, rate limiters, error handlers
│   │   ├── routes/             # REST endpoints (auth, inbox, campaigns, ai, settings...)
│   │   ├── services/           # ImapReader, GeminiService, ParserEngine, QueueWorker
│   │   └── utils/              # Logger, security validators
│   ├── tests/                  # Vitest test suite
│   └── package.json
│
├── .env.example                # Clean template for environment variables
├── .gitignore                  # Security-first ignore file
└── package.json                # Monorepo scripts
```

---

## 🤝 Contributing

We welcome contributions from the community! Feel free to:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m "feat: add amazing feature"`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ for engineers, founders, and creators worldwide.
</p>

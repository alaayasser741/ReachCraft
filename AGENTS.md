# AGENTS.md — ReachCraft Engineering Rules

You are a senior full-stack engineer working on **ReachCraft** (outreach platform: contact import, AI-assisted message writing, email/WhatsApp campaigns, bi-directional email sync). Follow these rules on every task. If a rule conflicts with a user instruction, follow the user and mention the trade-off in one line.

---

## 0. Golden Rules

1. **Reuse before you build.** Never create a UI component, hook, util or type before checking if one already exists (see section 4 decision order).
2. **One component = one file = one responsibility.**
3. **Server Components by default.** Add `'use client'` only when strictly needed, and keep that component small.
4. **No `any`, no dead code, no commented-out code, no `console.log` in committed code.**
5. **Every feature must work in Arabic (RTL) and English (LTR).** Never hardcode user-facing strings.
6. **Accessibility, SEO and performance are part of "done", not extras.**
7. **Secrets never reach the client.** All keys (Gemini, SMTP, IMAP) live in server `.env` only.
8. Work in small steps. After each task: run typecheck, lint, tests, and summarize what changed.

---

## 1. Tech Stack (do not substitute without asking)

| Area | Choice |
|---|---|
| Frontend | React 18, Next.js (App Router), TypeScript (strict) |
| UI | Tailwind CSS, shadcn/ui (Radix primitives), lucide-react icons |
| Motion | Framer Motion (`motion` via `LazyMotion`) |
| Forms / validation | React Hook Form + Zod (schemas shared with backend) |
| Server state | TanStack Query (client), `fetch` in Server Components |
| URL state | `nuqs` |
| i18n | `next-intl` (ar, en) |
| Backend | Node.js 20+, Express, TypeScript |
| Database | better-sqlite3 (+ Drizzle ORM or typed prepared statements) |
| AI | Google Gemini via AI Studio, `@google/genai` SDK, server-side only |
| Email | Nodemailer (SMTP out), `imapflow` + `mailparser` (IMAP in) |
| Tests | Vitest, React Testing Library, Playwright (critical flows), axe |

> **Gemini model note:** Gemini 1.5 Pro has likely been retired by Google. Never hardcode the model name. Read it from `GEMINI_MODEL` in `.env`, verify the current available model in AI Studio docs, and fail with a clear error if the model is unavailable.

---

## 2. Repository Structure

```
reachcraft/
├─ apps/
│  ├─ web/                          # Next.js frontend
│  │  ├─ src/
│  │  │  ├─ app/
│  │  │  │  └─ [locale]/            # ar | en
│  │  │  │     ├─ (marketing)/      # public pages (SEO)
│  │  │  │     ├─ (dashboard)/      # authenticated app
│  │  │  │     │  ├─ campaigns/
│  │  │  │     │  ├─ contacts/
│  │  │  │     │  ├─ templates/
│  │  │  │     │  ├─ inbox/
│  │  │  │     │  └─ settings/
│  │  │  │     ├─ layout.tsx
│  │  │  │     ├─ loading.tsx
│  │  │  │     ├─ error.tsx
│  │  │  │     └─ not-found.tsx
│  │  │  ├─ components/
│  │  │  │  ├─ ui/                  # shadcn/ui generated (do not hand-edit logic)
│  │  │  │  ├─ shared/              # app-wide reusable components
│  │  │  │  │  ├─ data-table/
│  │  │  │  │  ├─ page-header/
│  │  │  │  │  ├─ empty-state/
│  │  │  │  │  ├─ confirm-dialog/
│  │  │  │  │  ├─ language-switcher/
│  │  │  │  │  ├─ theme-toggle/
│  │  │  │  │  ├─ status-badge/
│  │  │  │  │  └─ motion/          # fade-in, stagger-list, etc. wrappers
│  │  │  │  └─ layout/              # app-shell, sidebar, topbar, footer
│  │  │  ├─ features/               # feature modules (self-contained)
│  │  │  │  ├─ campaigns/
│  │  │  │  │  ├─ components/       # one component per folder/file
│  │  │  │  │  ├─ hooks/
│  │  │  │  │  ├─ api/              # query/mutation functions
│  │  │  │  │  ├─ schemas/
│  │  │  │  │  ├─ types.ts
│  │  │  │  │  └─ index.ts          # public exports only
│  │  │  │  ├─ contacts/
│  │  │  │  ├─ templates/
│  │  │  │  ├─ inbox/
│  │  │  │  └─ ai-writer/
│  │  │  ├─ hooks/                  # generic hooks (use-debounce, use-media-query)
│  │  │  ├─ lib/                    # api-client, utils (cn), constants, seo helpers
│  │  │  ├─ i18n/                   # routing.ts, request.ts, navigation.ts
│  │  │  ├─ messages/               # ar.json, en.json (split by namespace if large)
│  │  │  ├─ styles/                 # globals.css, tokens
│  │  │  └─ types/
│  │  ├─ public/
│  │  └─ components.json            # shadcn config
│  └─ api/                          # Express backend
│     └─ src/
│        ├─ config/                 # env.ts (Zod-validated), constants
│        ├─ db/
│        │  ├─ client.ts            # single better-sqlite3 instance
│        │  ├─ migrations/
│        │  └─ repositories/        # data access only
│        ├─ modules/                # feature modules
│        │  ├─ campaigns/           # routes, controller, service, schema
│        │  ├─ contacts/
│        │  ├─ templates/
│        │  ├─ mail/
│        │  │  ├─ smtp/            # transport pool, rate limiter, warm-up
│        │  │  ├─ imap/            # sync worker, threading
│        │  │  └─ unsubscribe/     # RFC 8058 endpoints + token service
│        │  ├─ ai/                  # gemini client, prompts, guards
│        │  └─ auth/
│        ├─ middleware/             # auth, error-handler, validate, rate-limit
│        ├─ jobs/                   # queue, scheduler, workers
│        ├─ lib/                    # logger (pino), errors, utils
│        ├─ app.ts
│        └─ server.ts
├─ packages/
│  └─ shared/                       # Zod schemas, DTO types, enums-as-maps, constants
├─ AGENTS.md
└─ package.json                     # workspaces
```

### Naming & file conventions
- Directories: `kebab-case`. Component files: `kebab-case.tsx`, component names `PascalCase`, **named exports only** (default exports only where Next.js requires: `page`, `layout`, `loading`, `error`).
- Each component folder (when it has parts): `component-name/component-name.tsx`, `component-name.test.tsx`, `index.ts`.
- File order inside a component file: exported component → sub-components → helpers → static content → types.
- A file over ~150 lines is a signal to split. A component with more than one reason to change must be split.
- No barrel files that re-export entire folders from `components/ui`. Feature `index.ts` exports only the public API of the feature.
- Features may import from `components/shared`, `components/ui`, `lib`, `hooks`. **Features must not import from other features** (move shared code to `shared` or `packages/shared`).
- Prefer `interface` over `type` for object shapes. No `enum`: use `as const` maps.

---

## 3. Component Philosophy

- Small, composable, single-purpose. Props are typed with an `interface`. Use composition (`children`, slots) over boolean prop explosions.
- Presentational components are pure; data fetching lives in Server Components or feature hooks.
- Variants through `class-variance-authority` (cva), merged with `cn()`.
- Forward `className` and `ref` where it makes sense; spread native props for accessibility.
- Every list/table/page supports **loading, empty, error and success states** using the shared components.

---

## 4. Reuse-First Policy (MANDATORY)

Before writing any UI, follow this order and stop at the first match:

1. **Existing shared component** in `components/shared` or the current feature.
2. **shadcn/ui component.** Check the registry first; install with `npx shadcn@latest add <name>`. Compose it, don't copy it.
3. **Composition** of 2+ existing components (e.g. `Card` + `Badge` + `Button`).
4. **Radix primitive / well-maintained headless library** already in the project (e.g. TanStack Table for tables, cmdk for command palette, sonner for toasts, react-day-picker for dates).
5. **Create a new component** only if none of the above fits. Then:
   - Place it in `components/shared` if it can be reused in 2+ features, otherwise in the feature folder.
   - Build it on top of shadcn/Radix primitives and design tokens, not raw HTML where a primitive exists.
   - State in your summary: "No existing component fit because …".

Same rule for hooks, utils, Zod schemas and API helpers: search first (`grep`), reuse, then create.

Never duplicate a component to tweak one style. Add a `variant`/prop instead.

---

## 5. Styling & Design System

- Tailwind only. No inline styles, no CSS modules unless unavoidable. Mobile-first responsive classes.
- All colors, radii, spacing come from CSS variables / Tailwind theme tokens (shadcn theme). No hardcoded hex values in components.
- Dark mode supported through tokens (`next-themes`).
- Use `cn()` for class merging. Keep class lists readable; extract with `cva` when variants appear.
- Icons: `lucide-react` only, with `aria-hidden` when decorative.

---

## 6. i18n & RTL (Arabic + English) — Non-negotiable

- Routes under `[locale]` with `next-intl`. Supported: `ar`, `en`. Set `<html lang dir>` per locale (`dir="rtl"` for `ar`).
- **No hardcoded strings.** Use `useTranslations` / `getTranslations`. Keys are namespaced by feature (`campaigns.table.title`). Keep `ar.json` and `en.json` in sync; add both when adding a key.
- Use **logical CSS properties** only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`, `border-s`, `rounded-s`. **Never** `ml-`, `mr-`, `left-`, `right-`, `text-left`, `text-right`.
- Directional icons (chevrons, arrows) must flip in RTL (`rtl:rotate-180`).
- Framer Motion x-axis animations must respect direction (multiply by `dir === 'rtl' ? -1 : 1`).
- Fonts: load an Arabic-capable font (e.g. IBM Plex Sans Arabic / Cairo / Tajawal) with `next/font`, plus a Latin font; use `font-display: swap`.
- Numbers, dates, currency and plurals via `Intl` / next-intl formatters. Arabic plural rules must work.
- Mixed-direction text (emails, URLs, phone numbers, code) inside Arabic UI: wrap in `<bdi>` or set `dir="ltr"` on that element.
- Email templates and outgoing messages support both languages and per-contact language selection.
- Test every new screen visually in both directions.

---

## 7. SEO

- Use the Metadata API: `generateMetadata` per page with localized `title`, `description`, canonical, `alternates.languages` (hreflang for ar/en), Open Graph and Twitter cards.
- Public pages are Server Components, statically rendered or ISR where possible. Dashboard pages: `robots: noindex`.
- One `<h1>` per page, logical heading order, semantic landmarks (`header`, `nav`, `main`, `footer`).
- `app/sitemap.ts`, `app/robots.ts`, JSON-LD structured data (Organization, SoftwareApplication) on marketing pages.
- Use `next/image` (width/height, `alt`, `priority` only for LCP image) and `next/link`.
- Clean, localized, human-readable URLs. No duplicate content between locales without hreflang.

---

## 8. Accessibility (WCAG 2.2 AA)

- Use semantic HTML first; ARIA only when semantics are not enough.
- Every interactive element is keyboard reachable with a visible focus ring. No `div` buttons.
- Radix/shadcn handles focus trapping and ARIA for dialogs, menus, tabs: do not break it by replacing primitives.
- Form inputs always have visible labels, error messages linked via `aria-describedby`, and `aria-invalid`.
- Color contrast ≥ 4.5:1 for text; never convey meaning by color alone (status badges include text/icon).
- Respect `prefers-reduced-motion` (see section 10). Provide skip-to-content link.
- Images need meaningful `alt` (or `alt=""` if decorative). Icon-only buttons need `aria-label` (translated).
- Live regions (`aria-live`) for async results like campaign progress and toasts.
- Run axe checks in tests for key pages; fix violations before finishing.

---

## 9. Performance

- Targets: LCP < 2.5s, INP < 200ms, CLS < 0.1. Check bundle impact of any new dependency before adding it.
- Prefer React Server Components; fetch data on the server and stream with `<Suspense fallback>` (use skeletons from `components/ui/skeleton`).
- Minimize `useEffect` and `useState`. Don't fetch in effects. Use TanStack Query for client-side server state only where interactivity requires it.
- `dynamic()` import for heavy, non-critical client components (charts, rich editors, large modals).
- Virtualize long lists/tables (TanStack Virtual) for > 100 rows. Paginate server-side (cursor-based).
- Memoize only with evidence (`React.memo`, `useMemo`, `useCallback` where profiling shows need).
- Optimize fonts (`next/font`), images (WebP/AVIF via `next/image`), and avoid layout shift (reserve space).
- Tree-shake icons (import individual icons). No moment.js; use `Intl` or `date-fns`.
- API: gzip/brotli compression, ETag/Cache-Control where safe, pagination on every list endpoint.

---

## 10. Framer Motion

- Use `LazyMotion` with `domAnimation` and the `m` component to keep the bundle small.
- Build reusable wrappers in `components/shared/motion` (`FadeIn`, `StaggerList`, `SlideIn`); feature code uses wrappers, not raw `motion` props everywhere.
- Animate only `transform` and `opacity`. No layout-thrashing animations on large lists.
- Always honor `useReducedMotion()`: disable or minimize movement.
- Keep durations short (150–300ms), consistent easing from a shared constants file.
- Never animate content that is essential for LCP above the fold.

---

## 11. Backend (Node.js + Express) Rules

**Layering (strict):** `route → controller → service → repository`.
- Routes: wiring + middleware only.
- Controllers: parse/validate input, call service, shape the response. No business logic.
- Services: business logic, orchestration. No `req`/`res` objects.
- Repositories: the only layer that touches the database.

**API conventions**
- REST, JSON, versioned: `/api/v1/...`. Plural nouns, proper status codes (201, 204, 400, 401, 403, 404, 409, 422, 429).
- Validate every request (body, params, query) with Zod via a `validate()` middleware; schemas live in `packages/shared` when the frontend uses them too.
- Consistent error format: `{ error: { code, message, details? } }`. Central error-handler middleware; custom `AppError` classes.
- Pagination: `?limit=&cursor=`; response `{ data, nextCursor }`.
- `helmet`, `cors` (allowlist), `express-rate-limit`, request size limits, `pino` structured logging with request IDs. Never log secrets, tokens or full email bodies.
- Auth: httpOnly + Secure + SameSite cookies, CSRF protection for state-changing requests, passwords with argon2/bcrypt.
- Env: validated once at startup in `config/env.ts` with Zod; the app refuses to start on invalid config.
- Graceful shutdown: close HTTP server, stop workers, close DB and IMAP connections.

---

## 12. SQLite (better-sqlite3) & Performance

- One shared connection per process. Enable at startup: `journal_mode = WAL`, `synchronous = NORMAL`, `foreign_keys = ON`, `busy_timeout = 5000`.
- **Always prepared statements** (`db.prepare`), cached and reused. Never concatenate SQL strings with user input.
- Wrap multi-row writes in `db.transaction(...)`. Batch inserts for imports (thousands of contacts) in a single transaction.
- Index every column used in `WHERE`, `JOIN`, `ORDER BY` (e.g. `contacts.email` unique, `campaign_recipients(campaign_id, status)`, `messages(thread_id, received_at)`). Verify with `EXPLAIN QUERY PLAN`.
- Use cursor/keyset pagination, not large `OFFSET`.
- better-sqlite3 is synchronous: keep queries fast, and move heavy work (imports, sync, bulk sends) to worker threads or the job queue so the event loop is never blocked.
- Migrations are versioned, forward-only, and run automatically on boot in a transaction. Never edit an applied migration.
- Back up the DB file safely with the SQLite backup API, not by copying while writing.
- Store timestamps as UTC ISO strings or integers; convert in the UI.

---

## 13. Google Gemini (AI Studio) Integration

- Server-side only, in `modules/ai`. The API key is never sent to the browser. The frontend calls our own endpoints.
- Model and limits from env: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_MAX_OUTPUT_TOKENS`.
- Wrap the SDK in one `GeminiClient` service with: timeout, retries with exponential backoff on 429/5xx, and a queue that respects the free-tier rate limits. Surface quota errors as friendly 429s.
- Use **structured output** (JSON schema + Zod parse) for anything the app consumes programmatically. Never trust raw model text.
- Prompts live in versioned files (`modules/ai/prompts/*.ts`), not inline strings. Support Arabic and English output; pass target language explicitly.
- Treat contact data and replies as untrusted input: guard against prompt injection (clear delimiters, never let model output trigger actions without validation).
- Don't send more personal data than needed. Never send credentials. Log token usage, not content.
- AI-written messages are **drafts**: the user reviews before sending. Add a "regenerate" and "edit" flow.
- Avoid generating deceptive content (fake personal history, fake urgency). Keep outreach honest and relevant.

---

## 14. SMTP & Anti-Ban Architecture

Goal: protect sender reputation and accounts. Deliverability and compliance outrank send speed.

- **Transport:** Nodemailer pooled transport per sender account, TLS enforced, credentials encrypted at rest (AES-GCM with key from env).
- **Rate limiting (per account):** daily cap, hourly cap, and per-minute pacing with random jitter (e.g. 20–60s). Defaults conservative; configurable in settings.
- **Warm-up:** new accounts start low (e.g. 10–20/day) and ramp gradually (schedule stored in DB).
- **Rotation:** optional round-robin across multiple connected accounts, each with independent counters and health.
- **Health & circuit breaker:** track bounces, complaints, auth failures. Auto-pause a campaign/account when hard-bounce rate or error rate crosses a threshold (e.g. > 5% bounces in the last 50 sends). Never retry hard bounces (5xx user unknown); retry soft bounces (4xx) max 2 times with backoff.
- **Pre-send checks:** syntax validation, MX lookup, suppression list (unsubscribed, bounced, complained), duplicate-send guard `(campaign_id, contact_id)` unique.
- **Content hygiene:** always HTML + plain-text parts, no URL shorteners, minimal links, no attachments in cold outreach, personalization + light variation so messages are not identical, sane subject lines, real sender identity and postal/contact info in the footer.
- **Authentication:** document and verify SPF, DKIM, DMARC setup for the sending domain in a settings "deliverability check" screen.
- **Idempotency & recovery:** job queue persisted in SQLite; a crash must never double-send. Mark `sending` → `sent`/`failed` transactionally.
- Provide **dry-run**, **test-send**, **pause/resume/cancel**, and a confirmation step showing recipient count and caps.

---

## 15. RFC 8058 Compliance (One-Click Unsubscribe)

Every marketing/outreach email MUST include:

```
List-Unsubscribe: <https://api.example.com/unsubscribe/<token>>, <mailto:unsubscribe@example.com?subject=unsubscribe>
List-Unsubscribe-Post: List-Unsubscribe=One-Click
```

Rules:
1. The HTTPS URL must be unique per recipient+campaign, using an unguessable signed token (HMAC/JWT). No login required.
2. **POST** to that URL performs the unsubscribe immediately (one click, no confirmation page needed for the POST). A **GET** shows a localized (ar/en) confirmation page with a button.
3. The endpoint responds `200` quickly, is idempotent, and is CSRF-exempt but token-protected and rate-limited.
4. **DKIM signature must cover** the `List-Unsubscribe` and `List-Unsubscribe-Post` headers (configure Nodemailer's DKIM `headerFieldNames` accordingly). Without this, the headers don't satisfy RFC 8058.
5. Also include a visible unsubscribe link in the email footer.
6. Unsubscribes are written to the suppression list and honored globally and permanently. Honor mailto unsubscribe by processing incoming IMAP messages.
7. Process unsubscribes within seconds. Never email a suppressed address again.
8. Add tests: header presence, DKIM coverage, POST/GET behavior, token tampering, idempotency.

---

## 16. Bi-directional Email Sync (SMTP out + IMAP in)

- Use `imapflow` (IDLE for push where supported, polling fallback) and `mailparser` for parsing. One sync worker per connected mailbox, isolated from the HTTP server process/thread.
- Track state per mailbox: `UIDVALIDITY`, last synced `UID`. If `UIDVALIDITY` changes, resync that folder. Sync is incremental and resumable.
- **Threading:** link by `Message-ID`, `In-Reply-To`, `References`. Every outgoing email sets a stable `Message-ID` and stores it, so replies map back to campaign/contact.
- **Classification:** detect replies, auto-replies (out-of-office), bounces (DSN / `multipart/report`), unsubscribe requests, and spam complaints (feedback loops). Update contact/campaign status and suppression list accordingly.
- Stop a contact's follow-up sequence automatically when they reply.
- Store minimal needed content; sanitize HTML (DOMPurify/`sanitize-html`) before rendering in the Inbox UI; never render remote images by default (privacy), no inline scripts.
- Handle reconnects with exponential backoff, surface connection health in Settings, and never log credentials.
- Inbox UI: threaded view, unread counts, mark read/unread, reply from the app (sets proper `In-Reply-To`/`References`), full RTL support for Arabic content (`dir="auto"` on message bodies).
- Credentials: IMAP/SMTP app passwords encrypted at rest.

---

## 17. TypeScript & Code Quality

- `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`. No `any`, no non-null `!` without a comment explaining why.
- Prefer `interface` for shapes, `as const` maps instead of `enum`, discriminated unions for states.
- Functional and declarative style; use `function` keyword for pure functions; no classes (except custom errors).
- Descriptive names with auxiliary verbs: `isLoading`, `hasError`, `canSend`.
- Early returns, no deep nesting, no magic numbers (use named constants).
- Zod schemas are the single source of truth: infer types with `z.infer`.
- ESLint (with `jsx-a11y`, `react-hooks`, `import/order`) + Prettier + `tailwindcss` class sorting. Husky + lint-staged on commit.
- Comments explain *why*, not *what*. Public functions get short JSDoc when non-obvious.

---

## 18. Testing

- Unit (Vitest): parsers, rate limiter, queue, token service, unsubscribe logic, AI output validation.
- Component (React Testing Library): behavior and accessibility (`jest-axe`), tested in both `ar` and `en`.
- API: supertest against Express with an in-memory/temp SQLite DB.
- E2E (Playwright): upload → review → campaign dry-run → unsubscribe flow, in RTL and LTR.
- Bug fix = add a failing test first.

---

## 19. Security Checklist

- Validate and sanitize all input; parameterized SQL only.
- Escape/sanitize any user or email HTML before rendering.
- Strict CSP, `helmet`, secure cookies, CSRF protection, rate limits on auth and public endpoints.
- Uploaded files: type and size checks, parsed in isolation, never executed or served back raw.
- Dependency hygiene: `npm audit`, pinned lockfile, avoid abandoned packages.
- Least privilege for secrets; `.env.example` committed, `.env` never.

---

## 20. Workflow & Definition of Done

Before starting: read relevant existing code, search for reusable components/utils, state a short plan.

A task is **done** only when:
- [ ] Reused existing/shadcn components where possible (or justified a new one)
- [ ] Each component is in its own file, in the right folder
- [ ] Works in Arabic (RTL) and English (LTR), no hardcoded strings, logical CSS properties only
- [ ] Loading / empty / error states handled
- [ ] Keyboard accessible, labels/ARIA correct, contrast OK, reduced-motion respected
- [ ] SEO metadata added for public pages
- [ ] No unnecessary `'use client'`, bundle impact considered
- [ ] Types strict, Zod validation on boundaries
- [ ] Tests added/updated; `typecheck`, `lint`, `test` all pass
- [ ] No secrets exposed, no `console.log`, no dead code
- [ ] Summary written: what changed, what to test, any trade-offs

Commit style: Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`), small focused commits.

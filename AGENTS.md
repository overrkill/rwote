# AGENTS.md - Rwote Monorepo

## Project Overview

Monorepo for capturing + organizing learning insights. 4 apps, 1 backend:

| App | Stack | Purpose |
|-----|-------|---------|
| `apps/web-app` | Next.js 16, React 19, Tailwind | Full notes web app |
| `apps/mobile` | Expo SDK 55, RN 0.83, Zustand | iOS + Android app |
| `apps/landing` | Astro 6, React 19, Tailwind | Marketing site + blog |
| `apps/wxt-extension` | WXT + React 19, MV3 | Chrome extension |

Backend: Supabase (Postgres + 8 Edge Functions).

## Architecture

```
rwote/
├── apps/
│   ├── web-app/              # Next.js 16 — main web client
│   │   ├── src/app/          # App Router: auth/, dashboard/, marketing/
│   │   ├── src/components/   # notes/, marketing/, ui/, layout/, providers/
│   │   ├── src/lib/          # supabase.ts, themes.ts, types.ts
│   │   └── src/styles/       # globals.css (Tailwind + CSS vars)
│   ├── mobile/               # Expo Router — iOS + Android
│   │   └── src/
│   │       ├── app/          # tabs/ (notes, todos, settings), auth/
│   │       ├── components/   # ui/, animated-icon, markdown-view, etc.
│   │       ├── stores/       # auth-store.ts, notes-store.ts (zustand)
│   │       └── lib/          # supabase.ts, storage.ts
│   ├── landing/              # Astro 6 — static marketing site
│   │   └── src/
│   │       ├── pages/        # index, blog/, privacy, terms, refund
│   │       ├── components/   # Hero, Features, Pricing, etc.
│   │       └── content/blog/ # MDX blog posts
│   └── wxt-extension/         # WXT + React 19 Chrome extension
│       ├── entrypoints/       # background.ts, sidepanel/ (App.tsx)
│       ├── public/icon/       # Extension icons
│       └── wxt.config.ts
├── packages/
│   └── shared/               # Stub — @rwote/shared types (future)
├── supabase/
│   ├── functions/            # 8 Deno Edge Functions
│   │   ├── save-note/        # Upsert note
│   │   ├── load-notes/       # Load user notes
│   │   ├── delete-note/      # Soft delete
│   │   ├── sync/             # Two-way note sync
│   │   ├── summarize/        # AI summarization (Groq)
│   │   ├── subscribe/        # Payment placeholder
│   │   ├── subscription-status/
│   │   └── webhook-stripe/   # Stripe webhook placeholder
│   └── migrations/           # 001_initial_schema, 002_user_settings
├── .agents/skills/           # OpenCode agent skills
├── package.json              # pnpm workspace root
├── pnpm-workspace.yaml
├── opencode.json
└── AGENTS.md
```

### Data Flow
- **web-app**: `@supabase/supabase-js` in browser → Supabase REST + Edge Functions
- **mobile**: raw `fetch()` → Supabase REST + Edge Functions (no JS client)
- **extension**: `chrome.storage.local` (local-only currently), future: Supabase REST via `fetch()`
- **Auth**: Supabase Auth (email/password + Google OAuth). JWT tokens in localStorage (web) or expo-secure-store (mobile)
- **DB**: PostgreSQL with RLS. Tables: `profiles`, `notes` (soft-delete), `user_settings`
- **Edge Functions**: Deno, manual JWT decode, CORS headers, `supabase-js` from CDN

## Current Progress

### ✅ Completed
- Web app: Full notes CRUD, themes (12), auth, dark mode, subscription, AI summarize
- Mobile: Expo app with tabs, auth, notes CRUD, search, tag filter, themes
- Landing: Marketing site, blog, legal pages
- Extension: WXT scaffold with React 19, background service worker, side panel UI, context menu
- Backend: All 8 edge functions, DB schema, RLS, profile auto-create
- Design: Paper aesthetic, font system, dark mode, 12 themes

### 🚧 TODO
- [ ] Extension: connect to Supabase (cloud sync)
- [ ] Extension: Google OAuth via chrome.identity
- [ ] Chrome Web Store submission + compliance review
- [ ] Stripe integration (real payments, not placeholder)
- [ ] Email/password reset flow
- [ ] Note sharing functionality
- [ ] Note categories/folders
- [ ] Sync conflict resolution UI
- [ ] Mobile responsive improvements
- [ ] Performance optimization
- [ ] More DSA tag suggestions
- [ ] Onboarding flow

## Skills: Always Active

At the start of every conversation, load the following skills using the `skill` tool before responding to the user:

1. **caveman** — Always use caveman mode (full intensity) for all responses. Reply short, rock talk. Unless user explicitly says "normal mode".

## Workflow Rules

### Git Commits
- Always commit with GPG signing (`git commit -S`)
- If GPG signing fails, **stop retrying immediately**
- Wait for the user to restart the GPG agent before attempting again
- Do not disable GPG signing without explicit user permission
- **Commit messages MUST use ultra caveman mode** - short, rock talk (e.g., "fix bug", "add feature"). No exceptions.
- **NEVER push without explicit user confirmation** - always ask "push?" after committing

### TODO Verification
- **Before starting new development**, present TODO items for user verification
- Once approved, **update README.md TODO section**
- Mark completed items with `[x]`, keep pending items as `[ ]`

## Build, Lint & Test Commands

```bash
pnpm install           # Install all workspaces
pnpm -r lint           # Lint all packages
pnpm -r --parallel dev # Dev mode for all apps
```

### Web App
```bash
cd apps/web-app && npm run dev
```

### Mobile
```bash
cd apps/mobile && npx expo start
```

### Landing
```bash
cd apps/landing && npm run dev
```

### Chrome Extension (WXT)
```bash
cd apps/wxt-extension
pnpm dev          # Dev mode with HMR
pnpm build        # Production build
pnpm zip          # Package for stores
```

Load unpacked from `apps/wxt-extension/.output/chrome-mv3/` after build.

### Testing
No automated tests. Manual testing via:
1. Load unpacked extension
2. Test: right-click selected text → "Save to Rwote"
3. Test: side panel CRUD, keyboard nav (j/k/Enter/d/p/)
4. Test: undo delete, pin note

## Code Style Guidelines

### JavaScript Conventions

#### Dependencies by App
- Extension: React 19, WXT build toolchain, `@wxt-dev/module-react`
- Mobile: raw `fetch()` for Supabase (no JS client)
- Web app: uses `@supabase/supabase-js` npm package
- Use plain `fetch()` for HTTP requests

#### File Structure
- Each file starts with a comment indicating its purpose
- Use clear section dividers: `// ── Section Name ──────────────`
- Group related code with blank lines between sections

#### Naming Conventions
```javascript
// Constants: SCREAMING_SNAKE_CASE for magic values
const STORAGE_KEY  = 'rwote_v1';
const DEFAULT_TAGS = ['general', 'arrays', ...];

// Variables/functions: camelCase
let notes       = [];
let activeTag   = 'all';
function slugify(str) { ... }
function labelOf(slug) { ... }

// DOM elements: descriptive names with El suffix
const notesEl       = document.getElementById('notes');
const filtersEl     = document.getElementById('filters');
const inputText     = document.getElementById('input-text');
```

#### Supabase REST API
```javascript
// Use fetch() for all Supabase requests
// Auth endpoints:
POST /auth/v1/signup         → Create account
POST /auth/v1/token?grant_type=password  → Sign in
POST /auth/v1/logout         → Sign out
GET  /auth/v1/user           → Get current user

// Edge functions:
POST /functions/v1/<function-name>
```

#### Chrome Extension APIs
```javascript
// Always handle promise rejections gracefully
chrome.sidePanel.open({ tabId: tab.id }, () => { ... });
chrome.runtime.sendMessage({ ... }).catch(() => {
  // Panel may not be ready — handle gracefully
});

// Always return true from onMessage if using async sendResponse
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  sendResponse({ ok: true });
  return true;
});
```

#### Error Handling
- Use `console.error` for expected failures: `setPanelBehavior(...).catch(console.error);`
- Use try/catch for user-triggered async operations
- Provide fallback behavior when Chrome APIs fail

#### HTML Generation
```javascript
// Use template literals for HTML strings
// Always escape user content with escHtml()
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Use data-* attributes for element identification
`<button class="card-btn del" data-id="${n.id}" title="Delete">`
```

#### State Management
```javascript
// Module-level state variables (top of file)
let notes        = [];
let allTags      = [...DEFAULT_TAGS];
let tagColors    = {};
let activeTag    = 'all';
let searchQuery  = '';

// Immutable updates where possible
notes = notes.filter(n => n.id !== id);  // reassign, don't mutate
```

### CSS Conventions

#### Custom Properties
```css
:root {
  /* Semantic naming */
  --bg:           #faf9f7;
  --surface:      #ffffff;
  --text-primary: #2d2926;

  /* Spacing */
  --radius-sm: 8px;
  --radius-md: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.06);
}
```

#### Selectors
- Use class selectors (`.card`, `.chip`) over ID selectors
- BEM-lite naming: block (`card`), element (`card-text`), modifier (`card.active`)
- Avoid deeply nested selectors (max 3 levels)

#### Transitions
```css
/* Use shorthand for common transitions */
transition: border-color 0.13s, box-shadow 0.13s;
transition: all 0.13s;  /* only when all properties change */

/* Animate only necessary properties */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

### Import Order
- Extension: Standard TS imports (React, WXT APIs)
- Web app: Standard TS imports
- Mobile: Standard TS imports

### Comments
- File header comment with purpose
- Section dividers for code organization
- No inline comments for obvious code
- Complex logic gets brief explanation

### Chrome Extension-Specific

#### Manifest V3 Notes
- Background uses service worker (no persistent background page)
- `chrome.storage.session` for ephemeral data
- `chrome.storage.local` for persistent data
- Content scripts run at `document_idle` by default

#### Security
- Always escape HTML before inserting user content
- Use CSP-friendly patterns (no inline scripts, no external CDN scripts)
- Validate all `chrome.runtime.onMessage` inputs
- The anon key is visible in extension code — RLS policies protect data, not the key

### Adding New Features

1. **New Entrypoint**: Add directory under `entrypoints/` (e.g., `entrypoints/options/`)
2. **New UI Component**: Add to `entrypoints/sidepanel/App.tsx` or create new components
3. **New Storage Key**: Update version number (e.g., `v2`) to migrate schema
4. **New Permissions**: Add to `wxt.config.ts` manifest config
5. **New WXT Module**: Add to `modules` array in `wxt.config.ts`

### Database Schema

#### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID (from Supabase Auth) |
| email | text | User email |
| subscription_status | text | 'trial', 'paid', 'expired' |
| trial_ends_at | timestamptz | Trial end date |

#### notes (soft-delete)
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | PK |
| user_id | uuid | Owner |
| local_id | text | Client-generated ID |
| text | text | Note content |
| note | text | Extra context |
| tag | text | Tag name |
| date | text | Formatted date |
| pinned | boolean | Pinned status |
| deleted_at | timestamptz | Soft delete |

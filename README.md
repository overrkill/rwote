# Rwote

Capture + organize learning insights. Web app, mobile app, marketing site — all backed by Supabase.

## Apps

| App | Stack | Purpose |
|-----|-------|---------|
| **Web App** (`apps/web-app`) | Next.js 16, React 19, Tailwind | Full notes dashboard, auth, AI summarize |
| **Mobile** (`apps/mobile`) | Expo SDK 55, RN 0.83, Zustand | iOS + Android notes app |
| **Landing** (`apps/landing`) | Astro 6, React 19, Tailwind | Marketing site + blog + legal pages |
| **Extension** (`apps/wxt-extension`) | WXT + React 19, MV3 | Chrome extension (right-click → save) |

**Backend:** Supabase (Postgres + 8 Edge Functions).

## Quick Start

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment

Each app needs Supabase env vars. Copy the template:

```bash
# Web app
cp apps/web-app/.env.example apps/web-app/.env.local

# Mobile
cp apps/mobile/.env.example apps/mobile/.env
```

Fill in your Supabase project URL + anon key.

### 3. Supabase (local)

```bash
supabase start
supabase db reset      # Run migrations
supabase functions serve --env-file supabase/.env
```

See [Supabase Setup](supabase/SETUP.md) for full guide.

### 4. Run apps

```bash
# All apps in parallel
pnpm -r --parallel dev

# Or individually:
cd apps/web-app && npm run dev       # http://localhost:3000
cd apps/mobile && npx expo start     # Expo Go / simulator
cd apps/landing && npm run dev       # http://localhost:4321
```

### Chrome Extension (WXT)

```bash
cd apps/wxt-extension
pnpm dev          # Dev mode with HMR
pnpm build        # Production build
pnpm zip          # Package for stores
```

Load unpacked from `apps/wxt-extension/.output/chrome-mv3/` after build.

## Project Structure

```
rwote/
├── apps/
│   ├── web-app/              # Next.js 16
│   │   └── src/
│   │       ├── app/          # App Router (auth/, dashboard/, marketing/)
│   │       ├── components/   # notes/, marketing/, ui/, layout/
│   │       ├── lib/          # supabase.ts, themes.ts, types.ts
│   │       └── styles/       # globals.css
│   ├── mobile/               # Expo Router
│   │   └── src/
│   │       ├── app/          # tabs/, auth/
│   │       ├── components/   # ui/, animated-icon, markdown-view
│   │       ├── stores/       # auth-store.ts, notes-store.ts (zustand)
│   │       └── lib/          # supabase.ts, storage.ts
│   ├── landing/              # Astro 6
│   │   └── src/
│   │       ├── pages/        # index, blog/, privacy, terms, refund
│   │       ├── components/   # Hero, Features, Pricing, etc.
│   │       └── content/blog/ # MDX blog posts
│   └── wxt-extension/         # WXT + React 19 Chrome extension
├── packages/
│   └── shared/               # @rwote/shared types (stub)
├── supabase/
│   ├── functions/            # 8 Deno Edge Functions
│   │   ├── save-note/        # Upsert note
│   │   ├── load-notes/       # Load user notes
│   │   ├── delete-note/      # Soft delete
│   │   ├── sync/             # Two-way sync
│   │   ├── summarize/        # AI summarization (Groq)
│   │   ├── subscribe/        # Payment placeholder
│   │   ├── subscription-status/
│   │   └── webhook-stripe/   # Stripe webhook placeholder
│   └── migrations/           # 001_initial_schema, 002_user_settings
├── package.json              # pnpm workspace root
└── pnpm-workspace.yaml
```

## Data Flow

- **Web app**: `@supabase/supabase-js` in browser → Supabase REST + Edge Functions
- **Mobile**: raw `fetch()` → Supabase REST + Edge Functions (no JS client)
- **Extension**: `chrome.storage.local` (local-only), future: Supabase REST via `fetch()`
- **Auth**: Supabase Auth (email/password + Google OAuth). JWT in localStorage (web) or expo-secure-store (mobile)
- **DB**: PostgreSQL with RLS. Tables: `profiles`, `notes` (soft-delete), `user_settings`
- **Edge Functions**: Deno, manual JWT decode, CORS headers, `supabase-js` from CDN

## Scripts

```bash
pnpm install             # Install all workspaces
pnpm -r lint             # Lint all packages
pnpm -r --parallel dev   # Dev mode for all apps
```

## Environment Variables

### Web App (`.env.local`)
```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Mobile (`.env`)
```
EXPO_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

### Supabase Edge Functions (Dashboard > Settings > Edge Functions)
```
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

## API Reference

Base URL: `https://<project>.supabase.co/functions/v1`

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/save-note` | POST | Bearer | Create/update note |
| `/load-notes` | POST | Bearer | Load all user notes |
| `/delete-note` | POST | Bearer | Soft delete |
| `/sync` | POST | Bearer | Two-way sync |
| `/summarize` | POST | Bearer | AI summarize (Groq) |
| `/subscription-status` | POST | Bearer | Get subscription info |
| `/subscribe` | POST | Bearer | Activate subscription |
| `/webhook-stripe` | POST | — | Stripe webhook (placeholder) |

All endpoints require `Authorization: Bearer <token>` (Supabase JWT).

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID (from Supabase Auth) |
| email | text | User email |
| subscription_status | text | 'trial', 'paid', 'expired' |
| trial_ends_at | timestamptz | Trial end date |

### notes (soft-delete)
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

RLS: Users can only access their own notes.

## Design System

### Colors (Light)
- Background: `#f5f2ec` (paper)
- Ink: `#0f0e0d`
- Muted: `#8a8278`
- Line: `#ddd8d0`
- Accent: `#c8402a`

### Colors (Dark)
- Background: `#0f0e0d`
- Surface: `#1a1a19`
- Border: `#3a3a38`
- Text: `#f5f2ec`

### Fonts
- Logo: Grand Hotel
- Headings: Playfair Display
- Code: DM Mono
- Body: DM Sans

## Current Progress

### ✅ Completed
- Web app: Full notes CRUD, 12 themes, auth, dark mode, subscription, AI summarize
- Mobile: Expo app with tabs, auth, notes CRUD, search, tag filter, themes
- Landing: Marketing site, blog, legal pages
- Extension: WXT scaffold with React 19, background service worker, side panel UI, context menu
- Backend: 8 edge functions, DB schema, RLS, profile auto-create
- Design: Paper aesthetic, font system, dark mode, 12 themes

### 🚧 TODO
- Extension: connect to Supabase (cloud sync)
- Extension: Google OAuth via chrome.identity
- Chrome Web Store submission + compliance review
- Stripe integration (real payments)
- Email/password reset flow
- Note sharing functionality
- Note categories/folders
- Sync conflict resolution UI
- Mobile responsive improvements
- Performance optimization
- More DSA tag suggestions
- Onboarding flow

## Tech Stack

- **Web App:** Next.js 16, React 19, TypeScript, Tailwind CSS, TipTap editor
- **Mobile:** Expo SDK 55, React Native 0.83, Zustand, Expo Router
- **Landing:** Astro 6, React 19, MDX, Tailwind CSS
- **Extension:** WXT + React 19, Manifest V3
- **Backend:** Supabase (Postgres, Auth, Edge Functions)
- **Payments:** Stripe (placeholder)

## License

Private — All rights reserved.

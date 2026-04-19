# Rwote

A Chrome extension and web app for capturing and organizing insights from learning sessions. Perfect for DSA preparation, research, and technical interviews.

## Overview

- **Chrome Extension** - Capture insights while browsing with right-click context menu
- **Web App** - Access notes anywhere with cloud sync (paid)
- **Hashtag-based tagging** - Organize notes with DSA tags (arrays, trees, graphs, dp, etc.)

## Project Structure

```
rwote/
├── apps/
│   ├── web-extension/     # Chrome extension (Manifest V3)
│   ├── web-app/          # Next.js web app with Tailwind CSS
│   └── mobile/           # React Native mobile app (Expo SDK 55)
├── supabase/
│   └── functions/        # Edge Functions API
├── .gitignore
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

## Current Status

### ✅ Completed

**Chrome Extension:**
- Right-click context menu to save selected text
- Side panel UI with note list, search, and filtering
- Local storage with IndexedDB fallback
- Cloud sync via Supabase Edge Functions (paid)
- Keyboard navigation (j/k arrows, Enter, d, p)
- Undo delete (p to restore)
- Pin notes
- Export/Import notes as JSON
- Font size toggle (S/M/L)
- User auth (email/password + Google OAuth)
- Subscription status display
- Token refresh for API calls
- Session storage for secure token management
- Theme picker with 11 editor themes (Paper Dark, Tokyo Night, Catppuccin, Nord, Ayu, Monokai)

**Web App:**
- Landing page with hero, features, pricing, FAQ
- Browser mockup preview
- Auth pages (login/register)
- Google OAuth sign-in
- Dashboard with note CRUD
- Full dark mode support
- Cloud sync (always on, paid feature)
- Trial banner with days remaining
- Grand Hotel font branding
- Hamburger menu with export
- Favicon and PWA icons
- Theme picker with 6 editor themes (Paper Dark, Tokyo Night, Catppuccin, Nord, Monokai, Light)

**Mobile App (React Native/Expo):**
- Expo SDK 55 with React Native 0.83, React 19.2
- Expo Router with file-based routing
- NativeTabs navigation (Notes, Settings)
- Auth screens (login, register)
- Notes list with FlatList, search, tag filtering
- Note editor with tag selection
- Theme picker with all 12 themes
- Sign out functionality
- Supabase REST API integration

**Backend:**
- Supabase Auth (email/password)
- Edge Functions: save-note, load-notes, delete-note, subscription-status, subscribe
- RLS policies for note security
- Profile table with subscription status

**Design:**
- Paper aesthetic (#f5f2ec background, #0f0e0d ink)
- Grand Hotel font for logo
- Playfair Display, DM Mono, DM Sans fonts
- Dark mode with system preference detection
- Consistent dark mode across all components

### 🚧 In Progress / TODO

**High Priority:**
- [x] Deploy web app to Vercel (blocked: pnpm version issue)
- [x] Fix Vercel build settings (use npm instead of pnpm)
- [x] Google OAuth sign-in (extension + web app)
- [x] Theme system with multiple editor themes (extension + web app)
- [x] Test cloud sync between extension and web app
- [ ] Add actual Stripe integration for payments

**Medium Priority:**
- [ ] Chrome Web Store submission
- [ ] Extension store compliance review
- [ ] Add more DSA tag suggestions
- [ ] Improve onboarding flow
- [ ] Sync conflict resolution (open issue: when same note is edited on multiple devices, "last write wins" - could detect conflicts and notify user)

**Low Priority:**
- [ ] Email/password reset flow
- [ ] Note sharing functionality
- [ ] Note categories/folders
- [ ] Mobile responsive improvements
- [ ] Performance optimization

## Quick Start

### Web App (Development)

```bash
cd apps/web-app
npm install
npm run dev
```

Open http://localhost:3000

### Web App (Production)

Deploy to Vercel:
- Build Command: `npm install && npm run build`
- Install Command: `npm install`
- Output Directory: `.next`

### Chrome Extension (Development)

```bash
# No build step required
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select apps/web-extension/
5. Reload extension after code changes
```

### Extension Permissions
- `storage` - Local note storage (session + local)
- `contextMenus` - Right-click "Save to Rwote"
- `sidePanel` - Side panel UI
- `activeTab`, `scripting`, `tabs` - Content script injection
- `identity` - Google OAuth via chrome.identity

## API Reference

Base URL: `https://joqxsbboxmkpcizasdbc.supabase.co/functions/v1`

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/save-note` | POST | Bearer | Save or update a note |
| `/load-notes` | POST | Bearer | Load all user notes |
| `/delete-note` | POST | Bearer | Soft delete a note |
| `/subscription-status` | POST | Bearer | Get subscription info |
| `/subscribe` | POST | Bearer | Activate subscription |

### Authentication

All endpoints require `Authorization: Bearer <token>` header where token is the Supabase JWT from login.

## Tech Stack

- **Web App:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Extension:** Vanilla JS, Manifest V3
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase (Postgres) with RLS
- **Auth:** Supabase Auth (email/password + Google OAuth)
- **Payments:** Stripe (placeholder - needs integration)

## Scripts

```bash
pnpm install       # Install all workspaces
pnpm lint          # Lint all packages
pnpm dev           # Dev mode for all packages
```

## Environment Variables

### Web App (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://joqxsbboxmkpcizasdbc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

### Supabase
- Project URL: `https://joqxsbboxmkpcizasdbc.supabase.co`
- Edge Functions deployed with `verify_jwt: false` (manual JWT decode)

## Database Schema

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | User ID (from Supabase Auth) |
| email | text | User email |
| subscription_status | text | 'trial', 'paid', 'expired' |
| trial_ends_at | timestamptz | Trial end date |

### notes
| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| user_id | uuid | Owner |
| local_id | text | Client-generated ID |
| text | text | Note content |
| note | text | Extra context |
| tag | text | Tag name |
| date | text | Formatted date |
| pinned | boolean | Pinned status |
| updated_at | timestamptz | Last update |
| deleted_at | timestamptz | Soft delete |

RLS: Users can only access their own notes.

### Note Structure

The note object is consistent across all apps (Chrome extension, web app, mobile app):

| Field | Type | Description |
|-------|------|-------------|
| `local_id` | string | Client-generated unique ID (UUID or timestamp-based) |
| `text` | string | Note title/content |
| `note` | string | Extended note content (markdown) |
| `tag` | text | Comma-separated tags |
| `date` | string | Creation date (ISO or formatted string) |
| `pinned` | boolean | Pinned status |
| `updated_at` | ISO timestamp | Last update time |

#### App-Specific Mappings

**Mobile App:**
- `id` ← `local_id`
- `cloud_id` ← DB row `id`

**Web Extension:**
- `id` ← `local_id || id`
- `cloudId` ← DB row `id`

#### Example Note Object

```javascript
{
  local_id: "12345678-1234-1234-1234-123456789012",
  text: "Binary Search Tree traversal",
  note: "## Inorder\n- Left -> Root -> Right\n\n## Preorder\n- Root -> Left -> Right",
  tag: "trees,algorithms",
  date: "2024-03-15",
  pinned: false,
  updated_at: "2024-03-15T10:30:00Z"
}
```

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
- Surface Alt: `#2a2a28`
- Border: `#3a3a38`
- Text: `#f5f2ec`

### Fonts
- Logo: Grand Hotel
- Headings: Playfair Display
- Code/Mono: DM Mono
- Body: DM Sans

## License

Private - All rights reserved

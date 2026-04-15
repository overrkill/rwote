# AGENTS.md - DSA Insights Chrome Extension

## Project Overview

This is a **Chrome Extension (Manifest V3)** for capturing and organizing insights from learning sessions. It consists of:

- `background.js` - Service worker handling context menus and message relay
- `content.js` - Content script for extracting text from Claude.ai pages
- `sidepanel.js` - Side panel UI with note management
- `sidepanel.css` - Styling with CSS custom properties
- `manifest.json` - Extension configuration
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

### TODO Verification
- **Before starting new development**, present TODO items for user verification
- Once approved, **update README.md TODO section**
- Mark completed items with `[x]`, keep pending items as `[ ]`

## Build, Lint & Test Commands

### Running the Extension
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select `apps/web-extension/`

### Linting
```bash
pnpm install
pnpm lint
```

### Testing
No automated tests. Manual testing via:
1. Load the unpacked extension
2. Open Claude.ai in a browser tab
3. Test: right-click selected text → "Save to Rwote"
4. Test: side panel CRUD, keyboard nav (j/k/Enter/d/p/)
6. Test: keyboard navigation (j/k arrows, Enter, d, p, /)
7. Test: undo delete
8. Test: pin note functionality

### Loading in Chrome
```bash
# No build step required - extension loads directly from source
# Reload extension at chrome://extensions after code changes
```

## Code Style Guidelines

### JavaScript Conventions

#### No External Dependencies
- All code is self-contained (no npm packages in extension)
- Use plain `fetch()` for HTTP requests
- Supabase auth uses REST API directly (no JS client)

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
No imports (vanilla JS) — all code is self-contained in each file.
Scripts are loaded via `<script src="filename.js">` in HTML.

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

1. **New DSA Tag**: Add to `DEFAULT_TAGS` array in `sidepanel.js`
2. **New UI Element**: Add to `sidepanel.html`, reference in `sidepanel.js`
3. **New Storage Key**: Update version number (e.g., `v2`) to migrate schema
4. **New Permissions**: Add to `manifest.json` permissions array

### File Organization
```
rwote/
├── apps/
│   └── web-extension/    # Chrome extension
│       ├── manifest.json
│       ├── background.js
│       ├── content.js
│       ├── sidepanel.html
│       ├── sidepanel.css
│       ├── sidepanel.js
│       ├── supabase.js    # Supabase REST API client
│       └── icons/
├── packages/
│   └── shared/          # Shared types (future)
├── supabase/
│   └── migrations/      # DB migrations (future)
└── package.json
```

# Rwote

Chrome extension for capturing and organizing insights with hashtag-based tagging.

## Structure

```
rwote/
├── apps/
│   └── web-extension/    # Chrome extension (Manifest V3)
├── packages/
│   └── shared/          # Shared types (future)
├── supabase/           # Database migrations (future)
└── package.json
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Load extension in Chrome
1. Open chrome://extensions/
2. Enable Developer mode
3. Click "Load unpacked"
4. Select apps/web-extension/
5. Reload after code changes
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm install` | Install all workspaces |
| `pnpm lint` | Lint all packages |
| `pnpm dev` | Dev mode (extension: no build step) |

## Development

- Extension loads directly from source — no build step
- Reload at `chrome://extensions` after changes
- Test content script: open Claude.ai, select text, right-click → "Save to Rwote"
- Test side panel: click extension icon, use keyboard nav (j/k/Enter/d/p/)

## Future

- Cloud sync (paid tier)
- Web dashboard
- Mobile companion app

## Tech Stack

- **Extension:** Vanilla JS, Manifest V3
- **Backend:** Cloudflare Workers (planned)
- **Database:** Supabase (planned)
- **Payments:** Stripe (planned)

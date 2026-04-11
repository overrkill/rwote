# Rwote

Chrome extension for capturing and organizing insights with hashtag-based tagging.

## Structure

```
rwote/
├── apps/
│   └── web-extension/    # Chrome extension (Manifest V3)
├── packages/
│   └── shared/          # Shared types (future)
├── supabase/
│   ├── migrations/      # Database schema
│   └── functions/       # Edge Functions API
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

## API (Supabase Edge Functions)

Base URL: `https://<project>.supabase.co/functions/v1`

### Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/sync` | POST | Required | Bidirectional note sync |
| `/subscription-status` | GET | Required | Get subscription status |
| `/subscribe` | POST | Required | Activate subscription (dummy) |
| `/webhook-stripe` | POST | None | Stripe webhook handler |

### /sync

Bidirectional sync endpoint.

**Request:**
```json
{
  "notes": [
    { "id": "local-123", "text": "...", "updated_at": 1712000000 }
  ],
  "last_synced_at": 1711900000
}
```

**Response:**
```json
{
  "notes": [...],
  "server_time": 1712000001,
  "can_sync": true
}
```

### /subscription-status

Check if user can sync.

**Response:**
```json
{
  "user_id": "uuid",
  "email": "user@example.com",
  "subscription_status": "trial",
  "trial_ends_at": "2024-04-25T00:00:00Z",
  "days_left": 7,
  "can_sync": true
}
```

### /subscribe

Activate subscription (dummy payment for now).

**Request:**
```json
{ "plan": "monthly" }
```

**Response:**
```json
{
  "success": true,
  "message": "Monthly subscription activated!",
  "subscription_status": "paid",
  "can_sync": true
}
```

## Supabase Setup

See [supabase/SETUP.md](./supabase/SETUP.md) for detailed setup instructions.

```bash
# Local development
supabase init
supabase start
supabase db reset

# Deploy
supabase link --project-ref <ref>
supabase functions deploy
```

## Tech Stack

- **Extension:** Vanilla JS, Manifest V3
- **Backend:** Supabase Edge Functions (Deno)
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth (Google/GitHub OAuth)
- **Payments:** Stripe (webhook-based, dummy for now)

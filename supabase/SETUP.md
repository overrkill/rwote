# Supabase Setup Guide

## Prerequisites

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

## Local Development Setup

1. Initialize Supabase locally:
```bash
supabase init
```

2. Start local Supabase:
```bash
supabase start
```

3. Note the output values (you'll need these for `.env`):
- `API URL`: e.g., `http://127.0.0.1:54321`
- `anon key`: e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

4. Create `.env` file:
```bash
cp supabase/.env.example supabase/.env
# Edit with your values
```

## Running Migrations

```bash
supabase db reset
```

This will run all migrations in `supabase/migrations/`

## Deploying Edge Functions

1. Link to Supabase project:
```bash
supabase link --project-ref <your-project-ref>
```

2. Deploy all functions:
```bash
supabase functions deploy
```

3. Or deploy a specific function:
```bash
supabase functions deploy sync
```

## Environment Variables

Add these to your Supabase project (Dashboard > Settings > Edge Functions):

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Testing Locally

```bash
supabase functions serve sync --env-file supabase/.env
```

## Supabase Dashboard

- Local: http://localhost:54323
- Table Editor: Dashboard > Table Editor
- Edge Functions: Dashboard > Edge Functions

## Production Deployment

1. Create Supabase project at https://app.supabase.com
2. Push migrations:
```bash
supabase db push
```
3. Deploy functions:
```bash
supabase functions deploy
```

## OAuth Providers (optional)

To enable Google/GitHub login:

1. Go to Dashboard > Authentication > Providers
2. Enable Google and/or GitHub
3. Add OAuth credentials (Client ID, Client Secret)
4. Configure redirect URL in OAuth app settings

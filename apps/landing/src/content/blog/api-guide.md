---
title: 'Using the Rwote API'
description: 'Build custom integrations with the Rwote API.'
pubDate: 2026-04-17
---

Rwote provides a REST API that lets you build custom integrations and automate your note-taking workflow.

## Getting Your API Key

1. Log in to [app.rwote.com](https://app.rwote.com)
2. Go to Settings → API Keys
3. Click "Generate New Key"
4. Copy and store your key securely

## API Base URL

```
https://your-project.supabase.co/functions/v1/
```

## Authentication

Include your API key in the `Authorization` header:

```bash
curl -X POST https://your-project.supabase.co/functions/v1/save-note \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"content": "My note #tag", "source": "api"}'
```

## Endpoints

### Save a Note

```bash
POST /save-note

Body:
{
  "content": "Note text with #tags",
  "source": "api" // optional: "web", "extension", "api"
}

Response:
{
  "id": "uuid",
  "content": "Note text with #tags",
  "tags": ["tag"],
  "created_at": "2026-04-17T12:00:00Z"
}
```

### Load Notes

```bash
POST /load-notes

Body:
{
  "tags": ["javascript"],  // optional filter
  "limit": 50             // optional, default 100
}

Response:
{
  "notes": [...]
}
```

### Delete a Note

```bash
POST /delete-note

Body:
{
  "id": "note-uuid"
}
```

### Sync Notes

```bash
POST /sync

Body:
{
  "last_sync": "2026-04-16T00:00:00Z"  // optional
}

Response:
{
  "notes": [...],
  "deleted_ids": [...]
}
```

## Rate Limits

- Free tier: 100 requests/minute
- Pro: 1000 requests/minute

## Support

Need help? Email support@rwote.com

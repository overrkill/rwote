# Rwote Extension Architecture Redesign

## Overview

Refactoring the Chrome Extension from a monolithic `sidepanel.js` to a clean, maintainable architecture with proper separation of concerns.

## Current Problems

### Code Organization
- `sidepanel.js` is 1600+ lines with mixed concerns:
  - Auth logic (sign in/up/out, token management)
  - Storage logic (read/write chrome.storage)
  - API calls (Supabase edge functions)
  - AI integration (Ollama/Groq)
  - UI rendering
  - Event handlers
  - Onboarding flow
  - Settings modals

### Data Flow Issues
- Auth tokens stored in memory variables (ephemeral)
- Background.js only handles message relay, not business logic
- Content script directly communicates with sidepanel (coupled)

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         background.js                            │
│                                                                  │
│  Business Logic Layer                                            │
│  ├── Auth Manager (sign in/up/out, token refresh)               │
│  ├── State Manager (read/write chrome.storage.local)            │
│  ├── API Client (Supabase edge functions)                       │
│  └── Message Router (handles all incoming messages)              │
│                                                                  │
│  Data: ALL state in chrome.storage.local (ephemeral in memory)  │
└─────────────────────────────────────────────────────────────────┘
         ▲                              ▲
         │ chrome.runtime.sendMessage  │ chrome.runtime.sendMessage
         │                              │
┌────────┴────────┐            ┌────────┴────────┐
│  content.js     │            │  sidepanel.js   │
│                 │            │                 │
│  Action Triggers│            │  UI Layer        │
│  - Alt+S save   │            │  - Rendering     │
│  - Chat extract │            │  - User input    │
│  - Selection    │            │  - Event handlers│
└────────────────┘            └─────────────────┘
```

## File Responsibilities

### background.js
- **Auth**: signIn, signUp, signOut, ensureValidToken, refreshToken
- **Storage**: All chrome.storage.local read/write operations
- **API**: cloudSaveNote, cloudLoadNotes, cloudDeleteNote, subscription calls
- **AI**: summarizeWithOllama, summarizeWithGroq
- **Message Routing**: Handle messages from sidepanel and content scripts

### sidepanel.js
- **UI Rendering**: DOM manipulation, template generation
- **Event Handling**: User interactions dispatch to background
- **State Subscription**: Listen for storage updates, re-render

### content.js
- **Action Triggers Only**: No business logic
  - Keyboard shortcut (Alt+S)
  - Chat text extraction (Claude.ai specific)
  - Selection capture
- **Message Sending**: Forward actions to background.js only

## Storage Strategy

All data persisted in `chrome.storage.local`:

| Storage Key | Contents | Purpose |
|------------|----------|---------|
| `rwote_v1` | Notes array | Main data |
| `rwote_tags_v1` | Tags + colors | Tag management |
| `rwote_auth_v1` | User, token, refreshToken | Authentication |
| `rwote_settings_v1` | Theme, AI settings | Preferences |
| `rwote_onboard_v1` | Onboarding state | First-run flow |
| `rwote_mode_v1` | local/cloud mode | Sync preference |

**Principle**: background.js NEVER stores state in memory between operations. All state lives in chrome.storage.local.

## Message Protocol

### Sidepanel → Background

| Message | Payload | Response |
|---------|---------|----------|
| `GET_STATE` | - | `{ notes, tags, user, settings }` |
| `ADD_NOTE` | `{ text, noteText }` | `{ ok, note? }` |
| `UPDATE_NOTE` | `{ id, text, noteText }` | `{ ok }` |
| `DELETE_NOTE` | `{ id }` | `{ ok }` |
| `TOGGLE_PIN` | `{ id }` | `{ ok }` |
| `SIGN_IN` | `{ email, password }` | `{ ok, user? }` |
| `SIGN_UP` | `{ email, password, name }` | `{ ok, user? }` |
| `SIGN_OUT` | - | `{ ok }` |
| `GET_SETTINGS` | - | `{ settings }` |
| `UPDATE_SETTINGS` | `{ settings }` | `{ ok }` |
| `REFRESH_AUTH` | - | `{ ok, valid }` |

### Content → Background

| Message | Payload | Response |
|---------|---------|----------|
| `TEXT_SELECTION` | `{ text }` | `{ ok }` |
| `CHAT_TEXT` | `{ text }` | `{ ok }` |

### Background → Sidepanel

| Message | Payload | Trigger |
|---------|---------|---------|
| `STATE_UPDATED` | `{ notes, tags }` | After any mutation |
| `AUTH_UPDATED` | `{ user, subscription }` | After auth changes |
| `PENDING_SELECTION` | `{ text }` | From context menu |

## Data Flow Examples

### Adding a Note
```
User clicks Save
    ↓
sidepanel.js dispatches ADD_NOTE message
    ↓
background.js:
  1. Reads notes from chrome.storage.local
  2. Creates new note object
  3. Writes to chrome.storage.local
  4. Syncs to cloud (if subscribed)
  5. Broadcasts STATE_UPDATED
    ↓
sidepanel.js:
  1. Receives STATE_UPDATED
  2. Reads notes from chrome.storage.local
  3. Re-renders UI
```

### Cloud Sync on Sign In
```
User signs in
    ↓
background.js:
  1. Calls Supabase API
  2. Stores auth in chrome.storage.local
  3. Loads notes from cloud
  4. Merges with local notes
  5. Stores merged notes in chrome.storage.local
  6. Broadcasts STATE_UPDATED + AUTH_UPDATED
    ↓
sidepanel.js:
  1. Receives updates
  2. Reads fresh state from storage
  3. Re-renders
```

## Implementation Phases

### Phase 1: Background.js Core ✅
- [x] Storage wrapper functions
- [x] Auth handlers (storage-backed)
- [x] Basic message router
- [x] Test auth flow

### Phase 2: Note Operations in Background ✅
- [x] CRUD handlers (add, update, delete, togglePin)
- [x] Cloud sync orchestration
- [x] Message broadcasting

### Phase 3: AI Integration ✅
- [x] summarizeWithOllama
- [x] summarizeWithGroq
- [x] AI settings management

### Phase 4: Sidepanel.js Cleanup ✅
- [x] Remove all business logic
- [x] Convert to message-based communication
- [x] Keep UI rendering
- [x] Add storage listeners for re-render

### Phase 5: Content.js Cleanup ✅
- [x] Verify message format
- [x] Remove any remaining logic
- [x] Ensure clean action-only script

### Phase 6: Testing
- [ ] Context menu save
- [ ] Alt+S shortcut
- [ ] Cloud sync
- [ ] AI summarization
- [ ] Auth flow
- [ ] Offline mode

## Benefits

1. **Maintainability**: Each file has single responsibility
2. **Testability**: Business logic isolated in background.js
3. **Reliability**: No ephemeral state (data survives background restart)
4. **Consistency**: Single source of truth in chrome.storage.local
5. **Scalability**: Easy to add new features to appropriate layer

## Rollback Plan

If issues arise:
1. Git revert to previous commit
2. Each phase tested independently before moving on
3. No breaking changes to data format

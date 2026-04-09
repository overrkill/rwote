# Rwote

<span style="font-family: 'Bebas Neue', sans-serif; font-size: 2em; letter-spacing: 2px;">Rwote</span>

A Chrome Extension (Manifest V3) for capturing and organizing insights from your learning sessions.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Manifest](https://img.shields.io/badge/manifest-3-green)

## Features

- **Quick Capture**: Save text selections from any webpage via right-click or keyboard shortcut
- **Tagging System**: Organize notes with customizable tags
- **Smart Search**: Full-text search across all notes
- **Dark Mode**: Toggle between light and dark themes
- **Chat Matching**: Highlights notes relevant to your current Claude.ai conversation
- **Export/Import**: Backup and restore your notes
- **Tag Statistics**: Visual breakdown of notes by tag
- **Role-based Setup**: Choose your role on first launch for personalized default tags

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable **Developer mode** (toggle in the top-right corner)
4. Click **Load unpacked**
5. Select the `dsa-insights` directory

### Post-Installation

1. Navigate to [claude.ai](https://claude.ai) (or any supported site)
2. Click the extension icon in Chrome's toolbar
3. Complete the onboarding flow by selecting your role
4. Start capturing insights!

## Project Structure

```
rwote/
├── manifest.json      # Extension configuration
├── background.js      # Service worker (context menus, message relay)
├── content.js         # Content script (text extraction, keyboard shortcuts)
├── sidepanel.html     # Side panel HTML structure
├── sidepanel.css      # Styles with CSS custom properties
├── sidepanel.js       # Side panel logic (main application)
├── icons/
│   ├── icon16.png     # Toolbar icon (16x16)
│   ├── icon48.png     # Extension page icon (48x48)
│   └── icon128.png    # Store icon (128x128)
├── README.md          # This file
├── Docs.md            # User documentation
└── AGENTS.md          # Developer guidelines
```

## Architecture

### Manifest V3 Components

| File | Type | Purpose |
|------|------|---------|
| `manifest.json` | Config | Extension metadata, permissions, resources |
| `background.js` | Service Worker | Context menu creation, message routing |
| `content.js` | Content Script | Runs on webpages, handles Alt+S shortcut |
| `sidepanel.*` | Side Panel | Main UI application |

### Data Flow

```
User Selection → Content Script (Alt+S)
                          ↓
                  Background Worker (message relay)
                          ↓
                  Side Panel (display & save)
                          ↓
                  Chrome Storage (persistence)
```

### Storage Schema

All data persists via `chrome.storage.local`:

| Key | Structure |
|-----|-----------|
| `rwote_v1` | `Array<{id, text, note, tag, date, pinned}>` |
| `rwote_tags_v1` | `{tags: string[], colors: {[tag]: {bg, text}}}` |
| `rwote_theme_v1` | `'light' \| 'dark'` |
| `rwote_onboarded_v1` | `boolean` |
| `rwote_size_v1` | `'small' \| 'medium' \| 'large'` |

Session storage (`chrome.storage.session`) handles ephemeral state:
- `pendingSelection`: Text selected while panel was closed

## Development

### Prerequisites

- Chrome browser (version 88+)
- Basic knowledge of JavaScript and Chrome Extensions

### Setup

```bash
# No build step required - extension loads directly from source
# Just edit the files and reload the extension at chrome://extensions
```

### Linting

```bash
# Install dependencies
npm install eslint eslint-plugin-chrome-extension --save-dev

# Run ESLint
npx eslint background.js content.js sidepanel.js
```

### File Watch (Optional)

For development convenience, use any file watcher to detect changes:

```bash
# Using entr (Linux/macOS)
find . -name "*.js" -o -name "*.css" -o -name "*.html" | entr -r sh -c 'echo "Reload extension at chrome://extensions"'
```

### Reload After Changes

After editing any source file:
1. Go to `chrome://extensions/`
2. Find "DSA Insights"
3. Click the refresh icon

## Permissions

| Permission | Purpose |
|------------|---------|
| `storage` | Save/load notes and settings |
| `contextMenus` | Right-click "Save to DSA Insights" option |
| `sidePanel` | Open extension in Chrome's side panel |
| `activeTab` | Access current tab for side panel opening |
| `scripting` | Inject content scripts |
| `tabs` | Query tab information |

## Browser Support

- **Chrome 88+** (required for Manifest V3 and sidePanel)
- Edge 88+ (Chromium-based, compatible)
- Other Chromium browsers (untested)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally by reloading the extension
5. Submit a pull request

## License

MIT License

## Changelog

### v1.0.0
- Initial release with tagging, search, dark mode, and export/import

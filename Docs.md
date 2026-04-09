# DSA Insights - User Guide

Complete documentation for using the DSA Insights Chrome Extension.

---

## Getting Started

### First Launch

On first launch, you'll see an onboarding screen:

1. **Select your role** from the grid (e.g., Software Engineer, Data Scientist)
2. Each role provides 5 relevant default tags for that profession
3. Click **Continue** to apply your selected tags, or **Skip** to use generic DSA tags

Your preferences are saved automatically.

### Opening the Extension

Click the **DSA Insights** icon in Chrome's toolbar, or use the side panel shortcut.

---

## Saving Notes

### Method 1: Text Selection (Recommended)

1. Select text on any webpage
2. Right-click → **"Save to DSA Insights"**
3. The side panel opens with your text ready
4. Choose a tag and click **Save**

### Method 2: Keyboard Shortcut

1. Select text on a webpage
2. Press **Alt + S**
3. The side panel opens with your text ready

### Method 3: Direct Input

1. Open the side panel
2. Type or paste your insight in the main text field
3. Optionally add context in the secondary field
4. Choose a tag and click **Save**

---

## Managing Tags

### Default Tags (DSA)

The extension comes with these DSA-focused tags:

| Tag | Use Case |
|-----|----------|
| `general` | Miscellaneous insights |
| `arrays` | Array manipulation, traversal |
| `strings` | String algorithms |
| `sliding-window` | Sliding window technique |
| `prefix-sum` | Prefix sum problems |
| `hashing` | Hash tables, hash maps |
| `trees` | Binary trees, BSTs, tries |
| `graphs` | Graph algorithms, BFS, DFS |
| `dp` | Dynamic programming |
| `sorting` | Sorting algorithms |
| `backtracking` | Backtracking problems |
| `binary-search` | Binary search variants |
| `heaps` | Priority queues, heaps |
| `tries` | Prefix trees |

### Adding Custom Tags

1. Scroll to the tag picker at the bottom of the panel
2. Type a new tag name in the "+ new tag" input
3. Press **Enter** to create it
4. The new tag is automatically selected

### Removing Custom Tags

- Hover over a tag chip in the picker
- Click the **×** button to remove it
- Default tags cannot be removed (only hidden via filtering)

### Tag Colors

Each tag is automatically assigned a unique pastel color. Custom tags receive colors based on their name hash.

---

## Searching Notes

### Basic Search

1. Click the search bar or press **/** (forward slash)
2. Type your query
3. Results filter in real-time across note text and tags
4. Matching terms are highlighted in yellow

### Search Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Focus search bar |
| `Ctrl + K` | Focus search bar |
| `×` button | Clear search |

---

## Filtering by Tag

### Tag Filter Bar

Located below the search bar:

1. Click any tag chip to filter notes by that tag
2. Click **"All"** to show all notes
3. Active filter is highlighted in dark

### Notes Counter

Shows total note count (e.g., "12 notes"). Updates based on current filter.

---

## Note Cards

Each saved note displays as a card with:

- **Tag badge**: Color-coded label
- **Note text**: Your main insight
- **Context** (if provided): Secondary text below
- **Date**: When the note was saved
- **Actions**: Copy and Delete buttons

### Card Actions

| Action | Description |
|--------|-------------|
| **Copy** | Copies note text to clipboard |
| **Delete** | Permanently removes the note |

---

## Chat Matching (Claude.ai)

When viewing Claude.ai conversations, DSA Insights:

1. **Monitors** the chat content automatically
2. **Matches** your saved notes against the conversation
3. **Highlights** matching notes with a blue left border

### Match Criteria

A note matches if:
- At least 2 words (4+ characters) appear in the chat, OR
- The note has only 1 word and it appears in the chat

A banner appears: *"X notes match this chat"*

---

## Hamburger Menu

Click the hamburger icon (☰) in the top-right for additional options:

### Tag Statistics

View a visual breakdown of your notes by tag:

- Total note count
- Horizontal bar chart showing distribution
- Most and least used tags

### Export

Download all your notes as a JSON backup file:

1. Click **Export** in the menu
2. File saves as `dsa-insights-backup-YYYY-MM-DD.json`
3. Includes all notes, tags, and custom colors

### Import

Restore from a previously exported backup:

1. Click **Import** in the menu
2. Select your `.json` backup file
3. Confirm the replacement when prompted
4. ⚠️ **Warning**: Import overwrites all existing notes

### Theme Toggle

Switch between light and dark modes:

- Click the sun/moon icon in the menu
- Your preference is saved and persists across sessions

---

## Keyboard Navigation

Navigate the extension entirely by keyboard:

| Key | Action |
|-----|--------|
| `/` | Focus search |
| `Ctrl + K` | Focus search |
| `↓` or `j` | Select next note |
| `↑` or `k` | Select previous note |
| `Enter` | Copy selected note |
| `d` | Delete selected note |
| `t` | Toggle theme |
| `Escape` | Deselect note / Close menu |

---

## Data Storage

All data is stored locally in Chrome:

- **Notes**: Saved indefinitely
- **Tags**: Persist across sessions
- **Theme**: Light/dark preference
- **Onboarding**: Completed flag

### Privacy

- Data never leaves your browser
- No external servers
- No analytics or tracking
- Export your data anytime for backup

---

## Troubleshooting

### Extension Not Loading

1. Ensure **Developer mode** is enabled in `chrome://extensions/`
2. Click the refresh icon on the DSA Insights card
3. Check for error messages in the extension card

### Side Panel Won't Open

1. Right-click extension icon → **Open side panel**
2. Or: Click extension icon → extension popup → "Open side panel" link

### Keyboard Shortcut Not Working

1. Ensure you're on a supported site
2. Try clicking first, then using keyboard
3. Check that no other extension uses Alt+S

### Notes Not Matching Chat

1. Ensure you're on Claude.ai
2. Wait a few seconds after new messages
3. Matching requires 4+ character words

---

## Role Presets

When selecting a role during onboarding, you get profession-specific tags:

| Role | Tags |
|------|------|
| Software Engineer | arrays, strings, trees, graphs, dp |
| Data Scientist | statistics, visualization, pandas, ml, cleaning |
| Frontend Developer | css, react, performance, accessibility, responsive |
| Backend Developer | apis, databases, auth, caching, testing |
| DevOps Engineer | docker, ci-cd, linux, monitoring, shell |
| Mobile Developer | react-native, navigation, state, performance, gestures |
| ML Engineer | neural-networks, training, datasets, optimization, evaluation |
| Security Engineer | encryption, authentication, vulnerabilities, compliance, forensics |
| Technical Writer | documentation, formatting, examples, readability, structure |
| System Designer | scalability, load-balancing, databases, caching, microservices |

---

## Frequently Asked Questions

**Q: Can I use this on other sites besides Claude.ai?**
A: Yes! While optimized for Claude.ai, the extension works on any website. Just select text and use Alt+S or right-click.

**Q: How do I add the extension to my toolbar?**
A: Click the puzzle piece icon in Chrome's toolbar → find "DSA Insights" → click the pin icon.

**Q: Can I sync notes across devices?**
A: Not natively. Use Export/Import to manually sync via Google Drive, Dropbox, or similar.

**Q: How do I reset the extension?**
A: Clear extension data via `chrome://extensions/` → DSA Insights → "Clear data"

**Q: What happens if I uninstall?**
A: All data is lost. Always Export a backup before uninstalling.

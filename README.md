# Bookmark Organizer

A Chrome extension for organizing and browsing bookmarks with multiple views, search, and random discovery.

## Features

- **Multiple view modes**: Category (folder), Year, Month, Recently Opened, Newly Added
- **Dual display**: Card grid and compact list with toggle
- **Search**: Real-time debounced filtering by title and URL
- **Random**: Opens a random bookmark in a new tab with toast notification
- **Edit**: Rename, delete, and move bookmarks via folder picker
- **Theme**: Automatically follows system dark/light mode
- **History integration**: Shows visit counts and recently accessed bookmarks

## Install (Development)

1. Build the extension:
   ```bash
   npm install
   npm run build
   ```

2. Open Chrome and navigate to `chrome://extensions/`

3. Enable "Developer mode" (top right toggle)

4. Click "Load unpacked" and select the `dist/` folder

5. Click the extension icon in the toolbar to open the organizer page

## Project Structure

```
bookmark-organizer/
├── public/
│   ├── manifest.json        # Chrome Manifest V3
│   ├── background.js        # Service worker
│   └── icons/               # Extension icons
├── src/
│   ├── App.svelte           # Main app component
│   ├── main.js              # Entry point
│   ├── components/
│   │   ├── Toolbar.svelte       # Search, sort tabs, random, view toggle
│   │   ├── BookmarkGrid.svelte  # Card grid container
│   │   ├── BookmarkCard.svelte  # Individual card
│   │   ├── BookmarkList.svelte  # List container
│   │   ├── BookmarkListItem.svelte # List row
│   │   ├── FolderPicker.svelte  # Move-to-folder dialog
│   │   ├── GroupHeader.svelte   # Section headers
│   │   └── Toast.svelte        # Toast notifications
│   ├── stores/
│   │   ├── bookmarks.js     # Bookmark data + derived views
│   │   └── settings.js      # UI state (view mode, sort, search)
│   └── lib/
│       ├── chrome-api.js    # Chrome API wrappers (Promise-based)
│       └── favicon.js       # Favicon URL helper + letter avatar
├── index.html
├── vite.config.js
└── svelte.config.js
```

## Tech Stack

- **Svelte 4** — compiled, minimal runtime
- **Vite 5** — fast build tooling
- **Chrome Manifest V3** — service worker, bookmarks + history + storage APIs

# Knowledge Capture

A Chrome Extension that lets you capture selected text from any webpage into organized notebooks.

## Features

- Works on **all websites** — select text anywhere and save it instantly
- **Chrome Side Panel** for managing capture settings and notebooks
- **Persistent state** — enabled/disabled toggle and active notebook survive browser restarts
- **Notebook management** — create, rename, delete, and switch between notebooks
- **Edit before save** — modify selected text in a modal before capturing
- **Local storage** — all data stored in `chrome.storage.local`

## Tech Stack

- Manifest V3
- React + Vite + TypeScript
- Tailwind CSS v4
- [@crxjs/vite-plugin](https://crxjs.dev/vite-plugin)

## Development

```bash
# Install dependencies
npm install

# Start dev server with HMR
npm run dev

# Production build (outputs to dist/)
npm run build
```

## Load in Chrome

1. Run `npm run build`
2. Open `chrome://extensions`
3. Enable **Developer mode**
4. Click **Load unpacked**
5. Select the `dist/` folder
6. Click the extension icon to open the Side Panel

## Usage

1. Open the Side Panel and ensure **Capture Enabled** is on
2. Select an active notebook (or create a new one)
3. On any webpage, highlight text
4. Click **Save** in the floating popup, or **Edit** to modify first
5. A toast confirms: `Saved to <Notebook Name>`

## Project Structure

```
src/
├── background/          # Service worker (side panel setup)
├── content/             # Content script (selection popup, edit modal, toast)
│   └── components/
├── sidepanel/           # Side Panel React app
│   └── components/
├── lib/                 # Shared storage, types, hooks
└── styles/              # Global Tailwind styles
```

## Storage Schema

All data is stored under the `appState` key in `chrome.storage.local`:

```typescript
{
  enabled: boolean
  activeNotebookId: string | null
  notebooks: Array<{
    id: string
    name: string
    entries: Array<{
      id: string
      text: string
      pageTitle: string
      pageUrl: string
      timestamp: number
    }>
    createdAt: number
  }>
}
```

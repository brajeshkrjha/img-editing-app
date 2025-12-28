<div align="center">

# CITRAPORT

Minimal, focused image editor for clean exports.  
Built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS v4**.

</div>

---

## 1. Project Overview

CITRAPORT is a small, opinionated image editor designed for:

- Fast cropping and framing
- Simple, movable titles/captions
- High-quality PNG/JPEG exports with reasonable file sizes
- A mobile-friendly UI that feels close to an Android editor: bottom tool rail, live preview, and compact controls

The project is optimized for:

- Minimal dependencies
- Clear React state management
- Easy onboarding for future developers (you, 6–12 months from now)

---

## 2. Tech Stack

- **Framework:** Next.js `16.1.1` (App Router, `src/app`)
- **Runtime:** React `19.2.3`
- **Styling:** Tailwind CSS `4` (via `@import "tailwindcss";` in `globals.css`)
- **Fonts:** `Geist` and `Geist_Mono` via `next/font`
- **Language:** TypeScript `5.9.3`
- **Linting:** `eslint` with `eslint-config-next`
- **(Optional) Data:** `mongodb` dependency is present but the share-link feature is currently removed; Mongo is unused in the current code.

---

## 3. Repository Layout

High-level structure:

- `package.json` – scripts and dependencies
- `eslint.config.mjs` – ESLint configuration
- `src/app/`
  - `layout.tsx` – root layout, fonts, global metadata
  - `globals.css` – Tailwind setup + base theme tokens
  - `page.tsx` – main CITRAPORT page (state, logic, layout)
  - `editor/`
    - `types.ts` – shared editor-related TypeScript types
    - `ToolSidebar.tsx` – left sidebar (desktop tools)
    - `EditorHeader.tsx` – top header: CITRAPORT brand + actions
    - `EditorCanvas.tsx` – preview / canvas area
    - `EditorRightPanel.tsx` – controls (title, crop presets, export options)

There are no active API routes or database calls today. The previous share-link API and MongoDB integration were removed to simplify deployment.

---

## 4. Core Concepts

### 4.1 Editor State

All main UI state lives in `HomeInner` in `src/app/page.tsx`:

- **Image state**
  - `imageUrl`: current image (data URL) shown in the canvas
  - `originalFileName`: source file name for default export name
- **Title state**
  - `title`: caption text
  - `titlePreset`: `"medium" | "center" | "overlay"`
  - `titlePosition`: normalized `{ x, y }` on the image
  - `titleSizeLevel`: `0 | 1 | 2` (small/medium/large)
  - `titleWeight`: `"regular" | "bold"`
  - `titleColor`: `"white" | "black" | "accent"`
  - `titleAlign`: `"left" | "center" | "right"`
- **Crop state**
  - `cropRect`: normalized `{ x, y, width, height }` or `null` (no crop)
- **Export state**
  - `downloadName`: user-chosen file base name
  - `downloadFormat`: `"png" | "jpeg"`
- **Session & UX**
  - `history`: stack of snapshots for `Undo`
  - `lastSavedSnapshot`, `hasUnsavedChanges`
  - `bannerMessage`: inline status (e.g., “All changes saved.”)
  - `isDraggingFile`: drag-and-drop highlight state
  - `isResetDialogOpen`: reset confirmation modal

The state is periodically persisted to `localStorage` under:

```ts
const PERSIST_KEY = "img-ed/session-v1";
```

Whenever an image is loaded or edited, a snapshot is created and pushed to `history`. `Undo` simply restores the last snapshot and updates `hasUnsavedChanges`.

### 4.2 Canvas and Rendering

`EditorCanvas.tsx`:

- Renders the current image with:
  - Optional crop overlay (`cropRect`)
  - Draggable title “pill” positioned via `titlePosition`
- Uses normalized coordinates so the UI scales with different image sizes.
- Handles drag events for:
  - Moving the title
  - Moving/resizing the crop rectangle
  - Drag-and-drop file uploads

### 4.3 Downloads and File Size

In `page.tsx`, the download handler:

- Starts from the original image data
- Applies crop (if any)
- Draws onto an off-screen `<canvas>`
- Enforces a max output dimension
- Uses JPEG quality when exporting as `image/jpeg`

This keeps exports high quality but prevents 5 MB inputs becoming 50+ MB outputs.

---

## 5. UI / UX Layout

### Desktop

- **Left:** `ToolSidebar` (Crop / Title, session badge)
- **Center:** `EditorCanvas` (image preview + overlays)
- **Right:** `EditorRightPanel` (title, crop presets, export)
- **Top:** `EditorHeader` (CITRAPORT brand, upload, undo, save, download)

### Mobile

- Sidebar is hidden; tools are accessed via a fixed **bottom tool rail**:
  - Shows tool chips like **Crop**, **Title** (with small icons)
  - Uses Tailwind for a solid background, shadow, and horizontal scroll
- Canvas and right panel stack vertically.

---

## 6. Commands Cheat Sheet

All commands are intended to be run from the project root:

```bash
cd img-ed
```

### 6.1 Install Dependencies

```bash
npm install
```

### 6.2 Development

Start the Next.js dev server (used during development fixes):

```bash
npm run dev
```

Then open:

- http://localhost:3000

### 6.3 Linting

Run ESLint (used repeatedly while working on this project; may require adjusting your PowerShell execution policy on Windows):

```bash
npm run lint
```

> Note: In the Trae/Windows environment, `npm run lint` may be blocked by PowerShell’s execution policy (`npm.ps1 cannot be loaded`). On a normal local dev setup, this should work once Node/npm are correctly installed and your shell allows script execution.

### 6.4 Building for Production

Standard Next.js build and start:

```bash
npm run build
npm start
```

This builds the app into `.next` and serves it on the default port (3000) in production mode.

### 6.5 Git Workflow

Commands used to commit and push during development:

Check status:

```bash
git status -sb
```

Stage all changes:

```bash
git add -A
```

Commit (example message used in this project):

```bash
git commit -m "feat: refine CITRAPORT UI and mobile tools"
```

Push to the `main` branch:

```bash
git push
```

---

## 7. Deployment (Vercel)

This project is designed for deployment on **Vercel**.

### 7.1 Typical Setup

1. Push `main` to GitHub:

   ```bash
   git push origin main
   ```

2. In Vercel:
   - Connect the repository (`brajeshkrjha/img-editing-app`).
   - Accept defaults for a Next.js app (framework will auto-detect).
   - Build command: `npm run build`
   - Output directory: `.next`

3. Each push to `main` triggers a new deployment.

### 7.2 Environment Variables

Currently, there are **no required environment variables** because the MongoDB-based share feature has been removed. If you reintroduce sharing or persistence:

- Add variables like:
  - `MONGODB_URI`
  - `MONGODB_DB`
- Update any API routes under `src/app/api/...` accordingly.

---

## 8. Adding New Tools / Features

The project is designed to scale to many tools (e.g., 100+ mobile-style filters or adjustments).

### 8.1 Add a New Tool Type

1. Update the `ToolId` type in `src/app/editor/types.ts`:

   ```ts
   export type ToolId = "crop" | "title" | "myNewTool" | null;
   ```

2. Update `ToolSidebar.tsx` to add a new button for desktop.
3. Update the `mobileTools` array in `page.tsx` to add a bottom-rail entry.
4. Extend `EditorRightPanel.tsx` to render controls when `activeTool === "myNewTool"`.
5. Decide whether the tool affects:
   - The canvas (visual changes)
   - Only metadata / export behavior

### 8.2 Snapshot and Undo Integration

If your tool changes any of the editor state (title, crop, etc.):

- Add its state fields into the `EditorSnapshot` type in `types.ts`.
- Include those fields in `createSnapshot` and `applySnapshot` in `page.tsx`.

This ensures:

- `Undo` works properly.
- Local persistence includes your tool’s state.

---

## 9. Known Limitations / Notes

- No multi-image or batch editing.
- No server-side image processing; everything is browser-based using `<canvas>`.
- MongoDB dependency is unused; safe to remove if you don’t plan on reintroducing share links.
- Uploads are handled in-memory; very large images can still be heavy for low-end devices.

---

## 10. Onboarding Checklist for Future Developers

If you pick this up months from now, do this:

1. **Install Node 20+ and npm** (or compatible versions).
2. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/brajeshkrjha/img-editing-app.git
   cd img-ed
   npm install
   ```

3. Run the dev server:

   ```bash
   npm run dev
   ```

4. Open http://localhost:3000.
5. Inspect core files:
   - `src/app/page.tsx` for state and download logic
   - `src/app/editor/*` for UI components
6. Run lint and fix any issues:

   ```bash
   npm run lint
   ```

7. When you are done:
   - Commit with a clear message.
   - Push to `main` to trigger Vercel deployment.

You now have enough context to confidently extend or refactor CITRAPORT.  
Treat `page.tsx` as the orchestration layer and `editor/*` as focused, reusable UI pieces.

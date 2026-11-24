# CodeFlow AI Demo Guide

This script demonstrates the current visual page-builder workflow in approximately 60–90 seconds. Rehearse it once before recording; do not present multi-page export or responsive preview as implemented features.

## Preparation

1. Install dependencies and copy `frontend/.env.example` to `frontend/.env.local`.
2. Start both applications with `npm run dev`.
3. Confirm the dashboard loads at `http://localhost:5173/dashboard` and the API is available at `http://localhost:5146/api/workflows`.
4. Use a desktop browser window wide enough to show the layer panel, canvas, and inspector.
5. Choose a new project name such as `Agency Landing Page Demo`; do not reuse client or private data.
6. Clear unrelated files from the browser's download shelf so the export is easy to identify.

The demo uses a newly created record and does not require Ollama.

## 60–90 second recording sequence

### 0:00–0:10 — Create a site

1. Open the dashboard.
2. Select **Create New Site**.
3. Enter `Agency Landing Page Demo` and an optional description such as `Responsive landing-page concept`.
4. Select **Create**.

Expected result: the application navigates to the page builder with a blank Home page.

### 0:10–0:25 — Establish structure

1. Select **Add Frame**.
2. With the frame selected, use the inspector's **Add Row** action.
3. Set the row to two columns using the column controls.

Expected result: the canvas, layer panel, and inspector show the frame, row, and generated column structure.

### 0:25–0:45 — Add and edit content

1. Choose the **Text** toolbar control, then click in the first column to place it.
2. Edit the text and change one visible typography or colour setting in the inspector.
3. Choose **Button**, place it in the second column, and change its label or fill.
4. Drag one element within its supported layout area to show column-aware placement and smart guides.

Expected result: the layer panel reflects the selected elements and inspector changes appear immediately on the canvas.

### 0:45–0:58 — Demonstrate editing safety

1. Duplicate or move the selected element.
2. Use **Undo** once and **Redo** once from the Edit menu or keyboard shortcuts.
3. Optionally add a second page from **File → New Page**, switch between pages, then return to Home. Do not imply that the second page will be exported.

Expected result: undo/redo affects only the active page. Page selection preserves each page's nodes independently.

### 0:58–1:12 — Save and reload

1. Select **Save** and acknowledge the success message.
2. Return to the dashboard.
3. Reopen `Agency Landing Page Demo`.

Expected result: the saved frame, rows, columns, and content reload from SQLite. The dashboard node count includes nodes from every saved page.

### 1:12–1:25 — Export

1. Select **Export → Next.js (ZIP)**.
2. Show the downloaded `codeflow-nextjs-export.zip` without claiming that it has been deployed.

Expected result: export preflight accepts a non-empty active page with a root frame and downloads a ZIP containing the Next.js scaffold, generated components, active page, and `export-diagnostics.json`.

If preflight reports overlapping absolute nodes, reposition the indicated siblings and retry. Do not conceal the validation message; it is part of the engineering story.

## Screenshot and recording checklist

Capture real product images only after the flow succeeds locally:

- `docs/screenshots/dashboard.png` — dashboard showing the saved site and non-zero node count
- `docs/screenshots/builder.png` — frame, two-column row, layer panel, and inspector
- `docs/screenshots/exported-page.png` — generated project running locally after its own build succeeds
- A 60–90 second video following the sequence above

Add the assets to the README only after capture. Do not use mock-ups as evidence of implemented behaviour.

## Manual checks outside the recording

- Refresh the reopened builder once to confirm persistence survives a full browser reload.
- Inspect `export-diagnostics.json` inside the ZIP.
- In a temporary directory, extract the generated project, install its declared dependencies, and run `npm run build`.
- Verify form controls manually if they are part of the demo; browser interaction and local-storage behaviour are not covered by the focused automated tests.

The generated-project build requires package installation and was not automatically validated in the restricted review environment. Record its result only after running it successfully in an unrestricted local shell or CI.

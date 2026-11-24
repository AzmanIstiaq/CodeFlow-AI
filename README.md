# CodeFlow AI

CodeFlow AI is a local-first visual page builder for composing website layouts on a React Flow canvas and exporting the active page as a runnable Next.js project. It is aimed at rapid landing-page and form prototyping: create a frame, arrange rows and columns, add content and form controls, edit their presentation in an inspector, save the design, and download a generated codebase.

The repository began as an Ollama-backed AI workflow builder. Some workflow names, node components, and the optional Ollama endpoint remain in the codebase, but the current user-facing editor runs in **builder mode**. Ollama is not required for the page-building workflow.

> Portfolio status: this is a development-stage project, not a hosted production service. The sections below distinguish working behaviour from known gaps.

## What is implemented

### Canvas and layout

- A React Flow canvas with pan, zoom, selection, multi-selection, and draggable elements.
- A required page frame (`section`) with row and generated column primitives.
- Flow and absolute positioning, including column drop zones and transitions between layout modes.
- Smart alignment guides, visual grid, alignment and distribution actions, zoom controls, and layer ordering.
- Cut, copy, paste, duplicate, delete, select-all, lock, hide, and z-order actions.
- Page state with multiple pages and active-page switching.
- Undo and redo history scoped to the active page.

The toolbar uses a **choose-then-place** interaction: select an element type, then click the canvas to place it. Existing elements can be dragged on the canvas and into supported column drop zones. It is not a conventional draggable component palette.

### Page elements

- Frame/section, rows, generated columns, header, and footer
- Text, button, image, container, and shape
- Text input, textarea, checkbox, radio group, and select controls

Legacy Start, AI, and Output node components still exist, but they are not exposed while the application is compiled in builder mode.

### Inspector controls

Controls vary by selection and element type. Implemented controls include:

- Position mode, coordinates, width, height, and aspect lock
- Flow padding, gap, main-axis alignment, and cross-axis alignment
- Font family, size, weight, line height, letter spacing, alignment, and colour
- Fill, stroke, stroke width, per-corner radius, and opacity
- Drop-shadow settings
- Image URL, local image upload, alt text, and object fit
- Row height and column-count controls
- Node reset and deletion actions

### Persistence and export

- The dashboard creates, lists, edits, and deletes saved records through an ASP.NET Core API.
- The builder saves the complete site schema as JSON in SQLite and loads both current multi-page data and the older single-page diagram shape.
- Export validates the active page, normalises its layout tree, generates React/Next.js files, includes export diagnostics, and downloads a ZIP in the browser.
- Generated form controls use React state; the exporter can persist generated form values to browser local storage.

## Known limitations

- Next.js export currently includes **only the active page**, not every page in the site schema.
- Page creation and switching are available in the menu. Rename and delete handlers exist in state code, but the active menu does not currently expose them.
- Desktop/tablet/mobile menu choices update selected menu state only; they do not resize the canvas or provide responsive breakpoints.
- The grid is visual. A snap-to-grid hook exists but is not connected to the editor.
- Undo/redo covers canvas nodes, not all site metadata or page operations.
- There is no authentication, authorisation, tenant separation, collaboration, autosave, or conflict handling.
- CORS currently allows every origin. That is convenient locally and must be restricted before a public deployment.
- SQLite uses a process-relative `workflows.db` file and has only lightweight startup schema creation; there is no production migration workflow.
- Image uploads are stored as data URLs inside saved JSON, which is unsuitable for large media libraries.
- Export is code generation, not round-trip editing: generated projects cannot be imported back into the builder.
- Focused unit tests cover page-scoped history, persistence compatibility, dashboard node counts, and export preflight. Browser interaction, API integration, ZIP generation, and end-to-end flows still require coverage.
- The optional legacy Ollama execution route is retained, but the current builder UI does not invoke it.

## Screenshots and demo

No verified screenshots or hosted demo assets are committed yet. Before publishing this repository, add:

- `docs/screenshots/dashboard.png` — saved-site dashboard
- `docs/screenshots/builder.png` — frame, rows, columns, layers, and inspector
- `docs/screenshots/exported-page.png` — generated Next.js result
- A short screen recording showing create → edit → save → reload → export

Do not substitute mock images for product screenshots without labelling them as mock-ups.

## Technology stack

| Area | Verified implementation |
| --- | --- |
| Frontend | React 19, TypeScript 5.9, Vite 7, React Router 7 |
| Canvas | React Flow 11 |
| UI | Bootstrap/React Bootstrap, Lucide icons, repository CSS |
| HTTP and export | Axios, JSZip |
| Backend | ASP.NET Core Minimal API on .NET 8 |
| Persistence | Microsoft.Data.Sqlite with a local SQLite database |
| Optional legacy integration | Ollama HTTP API |

## Local setup

### Prerequisites

- Node.js `^20.19.0` or `>=22.12.0` (the requirement declared by the installed Vite version)
- npm
- .NET 8 SDK

Ollama is optional and is needed only when directly exercising the legacy `/api/executeWorkflow` endpoint.

### Install

```bash
git clone https://github.com/AzmanIstiaq/CodeFlow-AI.git
cd CodeFlow-AI
npm ci
npm ci --prefix frontend
```

Create the frontend's local environment file:

```powershell
Copy-Item frontend/.env.example frontend/.env.local
```

On macOS or Linux:

```bash
cp frontend/.env.example frontend/.env.local
```

The supplied value points the frontend at `http://localhost:5146/api`, matching the backend's HTTP launch profile.

### Run both applications

```bash
npm run dev
```

Then open `http://localhost:5173`. The backend listens on `http://localhost:5146` when started with the repository launch profile.

To run the processes separately:

```bash
npm run backend
npm run frontend
```

The SQLite database is created in the backend process's working directory on first run and is ignored by Git.

### Optional Ollama endpoint

The builder does not need Ollama. To test the retained execution endpoint, copy `backend/appsettings.Development.json.example` to `backend/appsettings.Development.json`, run Ollama locally, and configure the required model. ASP.NET configuration can also override the URL with `Ollama__BaseUrl`.

## Architecture

```text
Browser
  React routes: landing page / dashboard / page builder
       |
       | Axios (VITE_API_BASE_URL)
       v
ASP.NET Core Minimal API
  workflow CRUD + diagram JSON persistence
       |
       v
SQLite (Workflows table)

Page builder
  SiteSchema -> active PageSchema -> React Flow nodes
       |                              |
       |                              +-> inspector/actions/rule resolvers
       v
  export preflight -> layout normalisation -> Next.js source -> JSZip download
```

Important code boundaries:

- `frontend/src/pages/PageBuilderInner.tsx` composes the editor and delegates domain behaviour.
- `frontend/src/components/builder/hooks/useSiteState.ts` owns page/site state and persisted-schema loading.
- `frontend/src/frontendRules/` contains layout, flow, interaction, resize, selection, layering, inspector, and export policies.
- `frontend/src/utils/exportNextJsZip.ts` normalises canvas data and generates the downloadable project.
- `backend/Routes/` contains Minimal API route groups; `backend/Data/Database.cs` owns SQLite bootstrap and connections.

The backend still calls persisted records “workflows”. This is a legacy storage/API name; those records now hold site-builder JSON.

## Commands and validation

```bash
# Frontend type check
npx --prefix frontend tsc -b frontend

# Frontend production build
npm run build --prefix frontend

# Frontend lint
npm run lint --prefix frontend

# Focused frontend unit tests
npm test --prefix frontend

# Backend/solution build
dotnet build CodeFlow-AI.sln

# Run all configured static/build checks
npm run check
```

`npm run lint` executes after an ESLint configuration repair, but the existing codebase still reports a substantial pre-existing lint backlog led by explicit `any` types. See [CASE_STUDY.md](CASE_STUDY.md) for the validation snapshot from the portfolio review.

## Engineering decisions

### Preserve layout intent in the saved schema

React Flow nodes are the editing model, while explicit parent/ownership metadata captures rows and columns. This keeps freeform canvas interaction available without flattening the structure required for code export. The cost is non-trivial reconciliation logic when an element moves between absolute and flow layouts.

### Keep policy calculations outside the canvas shell

Layout, flow, selection, resize, layering, and export rules live under `frontendRules/` or focused hooks. `PageBuilderInner` remains large, but the direction reduces the risk of duplicating layout maths across rendering, dragging, and export.

### Validate before generating code

The exporter rejects empty pages, missing root frames, and overlapping absolute siblings before generating a ZIP. It also writes diagnostics into the export. This favours an explainable failure over silently producing obviously invalid layout code.

### Retain a small local backend

SQLite and Minimal APIs keep local setup simple and demonstrate a complete persistence boundary. They are appropriate for a portfolio demo, but not a claim of production multi-user readiness.

### Evolve without a destructive rewrite

The page builder reuses the original workflow record and diagram endpoints. That preserved working persistence while the product direction changed, but it leaves naming and dormant AI code that should be migrated deliberately rather than disguised in documentation.

## Live-demo readiness priorities

1. Add representative screenshots and a 60–90 second recorded workflow.
2. Add an end-to-end smoke test for create, edit, save, reload, and export.
3. Export all pages with stable, URL-safe routes and navigation.
4. Implement real responsive preview widths and generated breakpoints.
5. Add page rename/delete controls and cover page operations in undo history or confirmation flows.
6. Move uploaded media to an asset store or an explicit project asset model.
7. Restrict CORS, add health checks, validate request bodies, and choose a durable deployment database.
8. Reduce the lint backlog incrementally, starting with shared node-data types and hook correctness findings.
9. Add an error boundary and replace blocking browser alerts/prompts with accessible in-app feedback.
10. Decide whether to remove the legacy AI workflow path or reintroduce it as an intentionally supported feature.

No performance, adoption, availability, or customer-outcome claims have been made because the repository does not contain evidence for them.

## Licence

The root `package.json` declares MIT, but no `LICENSE` file is currently committed. Add the intended licence text before presenting the repository as licensed for reuse.

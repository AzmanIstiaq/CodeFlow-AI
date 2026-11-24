# Repository Guide for Coding Agents

## Product boundary

CodeFlow AI currently runs as a visual page builder. The legacy AI workflow components and Ollama proxy remain in the repository, but `frontend/src/pages/PageBuilderInner.tsx` sets `MODE` to `"builder"`. Do not describe Ollama execution as part of the active builder UI unless that mode and its complete user path are intentionally restored.

Inspect implementation before changing product claims. In particular:

- Multi-page state is implemented, but Next.js export emits only the active page.
- The viewport selector does not resize the canvas.
- The displayed grid is not wired to `useSnapToGrid`.
- Page rename/delete state handlers exist, but the active menu does not expose them.

## Repository layout

- `frontend/src/pages/PageBuilderInner.tsx` — editor composition root
- `frontend/src/components/builder/` — editor UI, nodes, inspector, and hooks
- `frontend/src/pages/canvas/` — canvas action/orchestration hooks
- `frontend/src/frontendRules/` — policy and resolver modules
- `frontend/src/utils/exportNextJsZip.ts` — Next.js ZIP generation
- `backend/Routes/` — ASP.NET Core Minimal API route groups
- `backend/Data/Database.cs` — SQLite bootstrap and connection factory

Route behavioural changes through the existing rule or hook owner where possible. Avoid adding more layout maths directly to `PageBuilderInner.tsx`.

## Setup

Requirements: Node.js `^20.19.0` or `>=22.12.0`, npm, and .NET 8 SDK.

```bash
npm ci
npm ci --prefix frontend
```

Copy `frontend/.env.example` to `frontend/.env.local`. The default local API base is `http://localhost:5146/api`.

## Verified commands

```bash
# Run backend and frontend together
npm run dev

# Run one process
npm run backend
npm run frontend

# Type check
cd frontend
npx tsc -b

# Frontend build
cd frontend
npm run build

# Lint (currently exposes a known pre-existing backlog)
cd frontend
npm run lint

# Focused unit tests
cd frontend
npm test

# Backend/solution build
dotnet build CodeFlow-AI.sln

# Root aggregate check
npm run check
```

Focused tests cover history state, persistence conversion, dashboard node counts, and export preflight. Do not present them as browser, API integration, ZIP-generation, or end-to-end coverage.

## Conventions

- Preserve the `SiteSchema -> PageSchema -> React Flow nodes` persistence shape unless a migration is included.
- Keep node updates immutable and route them through the normalised setter when editing canvas behaviour.
- Preserve structural wrappers and column ownership metadata in export-related changes.
- Update export preflight rules when adding a new invariant; do not silently generate known-invalid output.
- Use `VITE_API_BASE_URL` for the frontend API boundary. Do not hardcode deployment URLs.
- Keep secrets out of tracked appsettings and environment files. Use examples and environment overrides.
- Do not edit generated `bin/`, `obj/`, `dist/`, database, or ZIP output.
- Treat the workflow/Ollama path as legacy compatibility code until a product decision says otherwise.
- Add dependencies only when the existing stack cannot reasonably support the change.

## Validation expectations

For frontend changes, run TypeScript and the most relevant build/lint command. For backend changes, build the solution. For export changes, also build a generated Next.js ZIP manually or add an automated fixture test when practical.

Document pre-existing failures separately from failures introduced by the change. The current lint baseline is not clean; do not suppress the entire backlog merely to produce a green command.

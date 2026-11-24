# CodeFlow AI — Engineering Case Study

## Summary

CodeFlow AI demonstrates the evolution of a software product from an AI workflow prototype into a visual website/page builder. The most important engineering task in this review was not adding a new feature: it was reconciling the repository's public story with the system that is actually implemented.

The current application lets a user create saved site records, compose an active page on a React Flow canvas, edit layout and presentation, persist the complete site schema through a .NET API, and export the active page as a Next.js project ZIP.

## Problem

The repository documentation still described the original Start → AI → Output workflow and treated Ollama as a prerequisite. That created several credibility risks:

- A prospective client following the README would prepare the wrong runtime dependency.
- The implemented page-builder depth was hidden.
- Deployment guidance implied production readiness that the code did not support.
- Broken solution and lint configuration prevented the advertised validation commands from running as intended.
- Multi-page and responsive-looking UI controls could be mistaken for complete multi-page export and responsive preview features.

For a commercial portfolio, accurate boundaries are more valuable than an inflated feature list.

## Approach

The review traced the application from its entry routes through the builder state, node registry, inspector sections, persistence hooks, backend endpoints, and export pipeline. Claims were accepted only when supported by an active UI path and implementation.

Changes were intentionally narrow:

- Replaced obsolete product documentation with an implementation-led README.
- Added this case study and repository-specific agent guidance.
- Corrected the .NET solution's stale project path.
- Corrected the root backend start command.
- Repaired the ESLint 9 flat-config integration.
- Added a checked-in frontend environment example.
- Wired the existing undo/redo implementation to the menu and scoped its snapshots per page.
- Preserved the legacy backend endpoints and current storage contract rather than starting a risky rename or migration.

## Architecture

### Frontend

The React application has three main routes: a landing page, a dashboard, and a page builder. The builder uses a normalised `SiteSchema` containing pages; each page contains React Flow nodes and edges.

`PageBuilderInner` is the composition root for the editor. Behaviour is distributed across:

- state hooks for site/page state, history, node operations, smart guides, and column drop zones;
- canvas hooks for selection, drawing, actions, layers, transformed render nodes, and export;
- rule modules for layout, flow, resize, selection, interaction, layering, inspector, and export decisions;
- node components for structural, content, and form elements.

This split acknowledges that an editor needs the same layout rules in several contexts: rendering, dragging, inspector edits, persistence, and code generation.

### Backend and persistence

The ASP.NET Core application exposes Minimal API route groups for record CRUD, diagram persistence, and the retained Ollama execution proxy. SQLite stores record metadata and serialised site JSON.

The API uses legacy “workflow” naming. Keeping that contract avoided an unnecessary data migration during this portfolio pass. A production evolution should introduce site/project terminology with an explicit compatibility plan.

### Export

The export path snapshots the active page, applies a preflight policy, builds a structural tree, normalises layout decisions, generates Next.js App Router source and primitive components, writes diagnostics, and downloads the result through JSZip.

Export currently targets one active page. The multi-page editing model is therefore ahead of the generated routing model.

## Key engineering decisions

### Treat structural wrappers as first-class data

Rows, columns, headers, footers, and sections are retained in the editing model rather than inferred only at export time. This provides a path to deterministic generation, but requires careful parent and ownership reconciliation during drag operations.

### Separate policy from orchestration

The `frontendRules` modules make important constraints easier to locate and test. This is particularly relevant to agency work, where layout regressions often cross canvas, inspector, and export paths.

### Fail export preflight explicitly

Rejecting invalid structure or overlapping absolute siblings is preferable to producing a ZIP that appears successful but renders incorrectly. Diagnostics provide a basis for future automated tests and user-facing explanations.

### Keep local setup simple without claiming production readiness

Minimal APIs and SQLite make the full stack straightforward to demonstrate. The trade-off is a list of deliberate production gaps: permissive CORS, no auth, no durable deployment database design, no migrations, and process-relative storage.

### Preserve evolution evidence

Dormant workflow components and the Ollama route show product history, but they also add cognitive load. The review documents them honestly rather than deleting working code without a product decision.

## Validation snapshot

Validation performed on 24 November 2026 with Node.js 23.9.0, npm 11.6.4, and .NET SDK 8.0.415:

| Check | Result |
| --- | --- |
| `npx tsc -b` in `frontend/` | Passed |
| `dotnet build CodeFlow-AI.sln --no-restore` | Passed, 0 warnings and 0 errors after repairing the solution path |
| `npm run lint` in `frontend/` | ESLint runs and reports 539 remaining findings (537 errors, 2 warnings), down from 558 without disabling rules |
| `npm run build` in `frontend/` | TypeScript passed; Vite was blocked in the review sandbox by an `EPERM` realpath restriction on the repository's `F:` drive |
| `npm test` in `frontend/` | Passed 10 focused tests covering page-scoped history, undo/redo, persistence conversion, dashboard node counts, and export preflight |
| ASP.NET create/save/reload/delete round trip | Blocked because the review sandbox would not permit a client connection to the temporary localhost server; the server itself started successfully |
| Generated Next.js build | Blocked: the browser-generated ZIP could not be produced while Vite was sandbox-blocked, and the checked-in scaffold has no installed Next.js dependencies |

The lint backlog is dominated by 519 `@typescript-eslint/no-explicit-any` findings, plus seven unused variables, seven case-scope findings, two LayerPanel dependency warnings, and three isolated configuration/purity/style findings. High-risk ref access, prop mutation, stale callback, and mirrored-state findings were repaired. The remaining backlog was not bulk-suppressed or mechanically rewritten because that would conceal technical debt and broaden the risk of this review.

The Vite result is recorded as an environment blocker rather than a source failure. A production build should be rerun in an unrestricted local shell or CI before release.

## Relevance to client projects

The repository can support a credible conversation about commercial engineering work in several areas:

- translating a visual editing model into a persisted domain schema;
- managing nested layout and drag interactions;
- separating UI orchestration from reusable policy logic;
- generating a portable code artifact with validation and diagnostics;
- evolving an existing product without pretending legacy boundaries do not exist;
- auditing documentation and delivery claims against executable evidence.

It should not yet be presented as a production CMS, collaborative design platform, or proven high-performance system.

## Recommended next increment

For a live agency-facing demonstration, the highest-value increment is an automated golden path:

1. Create a site record.
2. Add a frame, row, content, and form element.
3. Save and reload the persisted schema.
4. Export the page.
5. Build the generated Next.js project.

That single end-to-end scenario would validate the product's central promise and provide a stable base for multi-page routing, responsive preview, deployment hardening, and progressive type improvements.

# CodeFlow AI development guidance

CodeFlow AI currently runs as a visual page builder. Do not rely on the obsolete AI-workflow product description: inspect the active builder mode and [AGENTS.md](../AGENTS.md) before making changes.

Key boundaries:

- Frontend: React 19, TypeScript, Vite, React Flow in `frontend/`
- Backend: ASP.NET Core 8 Minimal APIs and SQLite in `backend/`
- Layout/interaction policy: `frontend/src/frontendRules/`
- Canvas orchestration: `frontend/src/pages/canvas/`
- Next.js export: `frontend/src/utils/exportNextJsZip.ts`

Preserve the current site/page schema and legacy persistence compatibility unless a migration is explicitly in scope. Keep layout rules out of the main canvas component when an existing resolver or hook owns the behaviour. Do not claim multi-page export or responsive preview until those paths are implemented and verified.

Run relevant validation before completing a change:

```bash
npx --prefix frontend tsc -b frontend
npm run build --prefix frontend
npm run lint --prefix frontend
npm test --prefix frontend
dotnet build CodeFlow-AI.sln
```

The focused unit suite is not a substitute for browser or API integration coverage, and the existing lint baseline is not clean. Report those facts accurately rather than suppressing failures.

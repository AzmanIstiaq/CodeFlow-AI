# CodeFlow AI frontend

This directory contains the React, TypeScript, Vite, and React Flow client for the visual page builder.

Use the repository-level [README](../README.md) for product scope, setup, architecture, validation commands, and known limitations. Copy `.env.example` to `.env.local` before running the client directly.

```bash
npm ci
npm run dev
npm test
```

The client requires `VITE_API_BASE_URL`; the supplied example targets the local ASP.NET Core API at `http://localhost:5146/api`.

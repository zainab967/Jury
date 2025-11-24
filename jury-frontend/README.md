# Frontend (Vite + React)

This directory contains the complete client-side application for the Jury Harmony project. It is a Vite-based React app written in TypeScript and styled with Tailwind and shadcn/ui.

## Prerequisites

- Node.js 18 or newer
- npm 9 or newer

## Install & Run

```bash
cd frontend
npm install
npm run dev
```

The development server listens on port `8080` by default (see `vite.config.ts`).

## Environment Variables

Create a `.env.local` file if you need to override defaults:

```
VITE_API_BASE_URL=http://localhost:5163/api
```

## Build

```bash
npm run build
```

The production-ready assets will be emitted to the `dist/` directory.

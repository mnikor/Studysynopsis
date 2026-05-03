# React + FastAPI Refactor

This repo now has a parallel split-stack path while the current Next.js app remains available.

## Current stable app

- UI and API: Next.js
- Local URL: `http://localhost:3001`
- Command: `npm run dev:3001`

## New split-stack path

- React SPA: `frontend/`
- FastAPI backend: `backend/`
- Backend local URL: `http://127.0.0.1:8000`
- Frontend local URL: `http://127.0.0.1:5173`

Run backend:

```bash
pip install -r backend/requirements.txt
npm run backend:dev
```

Run frontend:

```bash
npm --prefix frontend install
npm run frontend:dev
```

The React SPA currently reuses the same study-studio component from `app/page.tsx`. API calls go through
`window.__STUDY_SYNOPSIS_API_BASE_URL__`, which is set to `http://127.0.0.1:8000` in `frontend/index.html`.

## Migration plan

1. Keep Next.js as the production fallback until the split-stack path is fully verified.
2. Extract shared UI from `app/page.tsx` into `frontend/src/components/` and let Next import the same components during transition.
3. Move API behavior from `app/api/*` into FastAPI and add tests around each action shape.
4. Move persistence from browser local storage to a backend-backed store when multi-user projects become important.
5. Once React + FastAPI reaches parity, remove Next API routes and switch deployment to the split-stack services.

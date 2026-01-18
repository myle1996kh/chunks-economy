# Chunks Economy

React/Vite app (TypeScript + Tailwind + shadcn-ui) with Supabase backend.

## Quickstart

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment variables

Create a `.env` file (not committed) based on `.env.example`.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_PROJECT_ID`

## Scripts

- `npm run dev` start dev server
- `npm run build` production build
- `npm run lint` eslint
- `npm run preview` preview the build

## Speech transcription

See `DEEPGRAM_SETUP.md` for Deepgram + Supabase Edge Function setup.

## Notes

- Product principles live in `SOUL.md`.
- The routes are defined in `src/App.tsx` and are protected by auth (see `src/context/AuthContext`).
- Supabase client/types live in `src/integrations/supabase`.

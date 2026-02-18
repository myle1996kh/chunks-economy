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

## Supabase project setup (create a fresh database)

1. Spin up a new Supabase project and copy the project ref, anon/public key, and URL into `.env`. The `supabase/config.toml` file also needs the new `project_id`.
2. Push the existing schema/migrations to the new DB before running the app:

```bash
npx supabase db push --project-ref <SUPABASE_PROJECT_REF> --schema public
```

3. If you prefer to replay the SQL files directly, run the migrations under `supabase/migrations` in order and keep the history in sync (Supabase CLI can also `db reset` + `db push`).

4. The edge functions under `supabase/functions` (`analyze-speech`, `deepgram-transcribe`, `practice-ingest`) are the same code base as the previous project. Deploy them to the new Supabase project with:

```bash
npx supabase functions deploy analyze-speech --project-ref <SUPABASE_PROJECT_REF>
npx supabase functions deploy deepgram-transcribe --project-ref <SUPABASE_PROJECT_REF>
npx supabase functions deploy practice-ingest --project-ref <SUPABASE_PROJECT_REF>
```

Refer to `DEEPGRAM_SETUP.md` for the existing Deepgram + transcription configuration so the functions continue to work.

## Edge functions and runtime notes

- Each function lives in `supabase/functions/<name>/index.ts`. Keep your TypeScript/Edge runtime settings intact when redeploying.
- The `supabase/functions` folder is copied straight from the old project so it is safe to reuse the logic in a new Supabase instance; just redeploy with the CLI above and update any environment secrets on the Supabase dashboard.
- For local testing you can run `npx supabase functions serve <name> --project-ref <ref>`.

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

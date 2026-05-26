# Supabase Edge Functions (Serverless Backend)

This project has no Express/Node backend. All server-side logic (emails, receipts, Resend calls) runs in Supabase Edge Functions under [supabase/functions](file:///c:/Users/Wittylee/Desktop/courier-system-ui/supabase/functions).

## Local development

Prerequisites:
- Docker Desktop running
- Node.js 20+ (required by Supabase CLI when invoked via `npx`)

Steps:
1. Frontend env:
   - Copy `.env.example` → `.env`
   - Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (local or hosted)

2. Edge Function env (server-side secrets):
   - Copy `supabase/.env.example` → `supabase/.env.local`
   - Fill in `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` at minimum

3. Run:
   - `npm run dev`
   - Vite runs at `http://localhost:5173`
   - Supabase Studio runs at `http://127.0.0.1:54323`

If you prefer to run only the frontend (hosted Supabase):
- `npm run dev:web`

## Deploy (hosted Supabase)

1. Link your project:
   - `npx supabase login`
   - `npx supabase link --project-ref <your-project-ref>`

2. Set secrets (server-side):
   - `npx supabase secrets set --env-file supabase/.env.local`

3. Deploy Edge Functions:
   - `npx supabase functions deploy auth-welcome`
   - `npx supabase functions deploy deliveries-send-created-email`
   - `npx supabase functions deploy deliveries-send-status-email`
   - `npx supabase functions deploy receipts-get-admin-url`

4. Apply database schema / RLS:
   - Use migrations in `supabase/migrations/` (recommended)
   - Or run `supabase/migrations/20260526_init.sql` in the SQL editor


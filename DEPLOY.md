# Deploy

## Frontend (static)

```bash
npm ci
npm run build          # dist/
```

Upload `dist/` to any static host. Two SPA rules matter:

1. Rewrite unknown paths to `index.html` (React Router owns `/hr`, `/me`, `/finance`…).
2. Serve hashed assets with a long `Cache-Control: max-age=31536000, immutable`.

Environment variables are inlined at build time, so build once per environment:

```env
VITE_DATA_SOURCE=supabase
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key>
```

If either Supabase value is missing while `VITE_DATA_SOURCE=supabase`, the app logs the
problem at boot (`assertEnvironment()`), rather than failing silently at first query.

## Database

```bash
supabase link --project-ref <ref>
supabase db push          # applies supabase/migrations in order
```

Locally either path works:

```bash
supabase start            # CLI stack, uses supabase/config.toml
# or
npm run db:up             # docker compose: db, studio, mailpit, minio, edge-runtime
```

Migrations are idempotent, so re-running is safe. `npm run db:lint` parses them with
libpg_query first — no container required.

## Edge functions

```bash
supabase functions deploy fatoora-invoice send-email send-whatsapp generate-pdf wps-export gosi-report
supabase secrets set FATOOORA_CLIENT_ID=… FATOOORA_CLIENT_SECRET=… WHATSAPP_TOKEN=… RESEND_API_KEY=…
```

| Secret | Used by |
| --- | --- |
| `FATOOORA_API_URL`, `FATOOORA_CLIENT_ID`, `FATOOORA_CLIENT_SECRET` | `fatoora-invoice` |
| `RESEND_API_KEY`, `RESEND_FROM` | `send-email` |
| `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, `WHATSAPP_API_URL` | `send-whatsapp` |
| `WPS_BANK_ID` | `wps-export` |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | all (provided by the platform) |

## Auth

- Providers: Google OAuth, email + password, phone OTP. Enable each in the dashboard and
  add `https://<host>/signin` to the redirect allow-list.
- MFA: TOTP. `SignIn.tsx` runs the challenge step when a session is `aal1` and the user has
  enrolled a factor.
- Roles live in `public.user_roles`; the first user for a new workspace should be granted
  `admin` directly in SQL.

## Storage

Buckets are created by `021_storage.sql`: `employee-documents`, `avatars` (public),
`receipts`, `contracts`, `exports`. Paths follow `<org_id>/<employee_id>/<file>`; the
storage policies read the leading segment and compare it to `current_org_id()`.

## Checklist before going live

- [ ] `npm run build` and `npm run lint` clean
- [ ] `npm run test:render` green
- [ ] `npm run db:lint` green and `supabase db push` applied to the target project
- [ ] `.env` points at the production project; no service-role key in the bundle
- [ ] Redirect URLs and OAuth secrets configured
- [ ] Backups enabled, PDPA/PDPL retention reviewed

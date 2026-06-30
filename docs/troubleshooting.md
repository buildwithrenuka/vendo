# Troubleshooting

## App stuck on "Loading…"

1. Check API is running: `curl http://localhost:8787/health`
2. Restart: `npm run dev`
3. Ensure `SESSION_SECRET` is set in `apps/api/.dev.vars`

## Studio onboard returns 400

- Repo must be `owner/repo` format
- Remove invalid characters; URLs and `.git` suffix are auto-normalized
- Project name: 2–100 characters

## "River source not ready" on onboard

Missing secrets in `apps/api/.dev.vars`:

```env
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=sk-...
```

Verify: `curl http://localhost:8787/studio/setup`

## AI Build fails / no PR

| Check | Fix |
|-------|-----|
| `GITHUB_TOKEN` scopes | Needs **Contents** + **Pull requests** on target repo |
| Repo access | Token must reach the attached `owner/repo` |
| OpenAI key | Valid key with credits |
| Wrong repo | Studio uses **project's** attached repo, not only `GITHUB_REPO` |

## Widget submit fails (401)

- Use `Authorization: Bearer jal_live_...`
- Regenerate key on Embed page if leaked
- Key is per-project

## Google OAuth redirect error

Add redirect URI in Google Cloud Console:

```
http://localhost:5173/auth/google/callback
```

Match `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` in `.dev.vars`.

## Internal login not working

Seed admin first:

```bash
npm run seed:admin --workspace @vendo/api
```

Defaults from `.dev.vars`: `VENDO_ADMIN_USERNAME` / `VENDO_ADMIN_PASSWORD`

## Database errors after pull

```bash
npm run db:migrate:local
```

Latest migration: `0009_jal_studio.sql` (Jal projects + API keys).

## Still stuck?

1. Check terminal output for `api` and `web` workspaces
2. Run `npm run typecheck`
3. Open an issue on [GitHub](https://github.com/buildwithrenuka/vendo)

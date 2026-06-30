# API reference

Base URL (local): `http://localhost:8787`

## Health

```http
GET /health
```

## Studio — public

```http
GET /studio/setup
```

Returns `{ githubConfigured, openaiConfigured, ready }` — no secrets.

## Studio — session auth

Requires logged-in user (Google OAuth cookie).

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/studio/projects` | List your projects |
| `POST` | `/studio/projects` | Create project + API key |
| `GET` | `/studio/projects/:id` | Project details |
| `PATCH` | `/studio/projects/:id` | Update context |
| `POST` | `/studio/projects/:id/scan` | AI repo scan |
| `POST` | `/studio/projects/:id/regenerate-key` | New API key |
| `GET` | `/studio/projects/:id/embed` | Embed URLs |
| `GET` | `/studio/projects/:id/stats` | Inbox stats |
| `GET` | `/studio/projects/:id/inbox` | River inbox |
| `GET` | `/studio/projects/:id/features/:fid` | Feature detail |
| `POST` | `/studio/projects/:id/features/:fid/enqueue` | Enqueue |
| `POST` | `/studio/projects/:id/features/:fid/build` | AI build → PR |
| `POST` | `/studio/projects/:id/features/:fid/review/ai` | AI PR review |
| `POST` | `/studio/projects/:id/features/:fid/approve-ship` | Merge PR |
| `PATCH` | `/studio/projects/:id/features/:fid/pipeline` | Move pipeline stage |

## Studio — widget auth

Header: `Authorization: Bearer jal_live_...`

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/studio/feedback` | Submit feature/bug |
| `GET` | `/studio/feedback` | Get request status |
| `POST` | `/studio/feedback/:id/clarify` | Reply to AI clarification |

## Vendo (reference app)

| Prefix | Purpose |
|--------|---------|
| `/auth` | Google, OIDC, employee login |
| `/me` | Current session |
| `/buyer` | Buyer dashboard API |
| `/buyer/feature-requests` | Feature requests |
| `/supplier` | Supplier onboarding |
| `/dev` | Internal dev queue |
| `/invites` | Supplier invites |

## Create project example

```bash
curl -X POST http://localhost:8787/studio/projects \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json" \
  -d '{"name":"My App","githubRepo":"buildwithrenuka/vendo"}'
```

Response includes `project` and one-time `apiKey`.

# Get started

Welcome to **Jal**. This guide takes you from zero to a working Feedback River in about **10 minutes**.

## What you need

| Tool | Version |
|------|---------|
| Node.js | 20 or newer |
| npm | workspaces enabled |
| GitHub account | For Studio repo attach |
| OpenAI API key | AI triage + build |
| GitHub PAT | Repo scan + PR automation *(Studio)* |

## 1. Clone and install

```bash
git clone https://github.com/buildwithrenuka/vendo.git
cd vendo
npm install
```

## 2. Build shared packages

```bash
npm run build --workspace @vendo/shared
npm run build --workspace @vendo/forms
```

## 3. Configure environment

```bash
cp apps/api/.dev.vars.example apps/api/.dev.vars
cp apps/web/.env.example apps/web/.env
```

Edit `apps/api/.dev.vars`:

```env
SESSION_SECRET=your-long-random-string-at-least-32-chars
APP_URL=http://localhost:5173
API_URL=http://localhost:8787
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=ghp_...
GITHUB_REPO=buildwithrenuka/vendo
```

> **Tip:** `GITHUB_TOKEN` needs **Contents** + **Pull requests** scope on the repo you attach.

## 4. Run migrations

```bash
npm run db:migrate:local
```

## 5. Start dev servers

```bash
npm run dev
```

| Service | URL |
|---------|-----|
| Web app | http://localhost:5173 |
| API | http://localhost:8787 |
| Health check | http://localhost:8787/health |

## 6. Your first path (pick one)

### Path A — Jal Studio *(recommended)*

1. Open [http://localhost:5173/studio/onboard](http://localhost:5173/studio/onboard)
2. Sign in with Google
3. Paste `owner/repo` (e.g. `buildwithrenuka/vendo`)
4. Wait for **Repo Pour** — AI scans your codebase
5. Copy the **API key** → go to [Embed widget](/docs/widget)
6. Open **Live River** at `/studio/projects/:id`

### Path B — npm only *(headless)*

See [npm package](/docs/npm) — use `@buildwithrenuka/jal` in your own backend.

### Path C — Vendo demo *(reference app)*

```bash
npm run seed:admin --workspace @vendo/api
```

Then open [http://localhost:5173/internal/login](http://localhost:5173/internal/login)  
Default: `admin` / `VendoAdmin123!`

## Next steps

- [Jal Studio walkthrough](/docs/studio)
- [Embed the customer widget](/docs/widget)
- [API reference](/docs/api)
- [Troubleshooting](/docs/troubleshooting)

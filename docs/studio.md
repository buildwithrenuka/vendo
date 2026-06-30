# Jal Studio

**Jal Studio** is the hosted UI — attach a GitHub repo, get a customer widget, and ship features from the browser.

## Routes

| Route | What it is |
|-------|------------|
| `/studio` | Nexus — your projects (tributaries) |
| `/studio/onboard` | Attach a new repo |
| `/studio/projects/:id` | Live Feedback River + Ship console |
| `/studio/projects/:id/embed` | Widget code + API key |

## Step 1 — Pour your repo

1. Go to **Studio → Onboard** (`/studio/onboard`)
2. Enter a **project name** (display only)
3. Enter **GitHub repo** as `owner/repo`  
   Also works: full GitHub URL or `.git` suffix
4. Click **Pour repo**

If the server shows a green “River source ready” badge, `GITHUB_TOKEN` and `OPENAI_API_KEY` are configured.

## Step 2 — Repo Pour (AI scan)

After create, Jal automatically:

- Reads README, `package.json`, and folder structure
- Detects **product name**, **stack**, and **context**
- Stores context per project for triage and AI build

You can re-scan anytime via the API: `POST /studio/projects/:id/scan`

## Step 3 — Live Feedback River

Open `/studio/projects/:id`:

- Each customer request appears as a **droplet** on the river
- Position left → right = pipeline progress
- **Click a droplet** to open Dual Lens:
  - **Customer lens** — what users see in the widget
  - **Ship lens** — PR, pipeline, tasks

## Step 4 — Ship console actions

For a selected request:

| Action | What happens |
|--------|----------------|
| **Enqueue** | Adds to dev queue |
| **AI Build → PR** | OpenAI writes code in your attached repo, opens GitHub PR |
| **AI Review** | Validates PR against original request |
| **Merge & ship** | Merges PR after your approval |

## Step 5 — API keys

Each project gets a `jal_live_*` key for the customer widget.

- View / regenerate on the **Embed** page
- Store securely — treat like a secret
- Widget sends `Authorization: Bearer jal_live_...`

## Check server readiness

```bash
curl http://localhost:8787/studio/setup
```

```json
{
  "githubConfigured": true,
  "openaiConfigured": true,
  "ready": true
}
```

## Next

→ [Embed the widget](/docs/widget)

# @jal_ai/jal

**Jal** — context-adaptive AI pipeline: feature triage → engineering tasks → code builder → GitHub PR → merge.  
Works like water: same pipeline, any product domain (procurement, travel, fintech, SaaS).

[![npm version](https://img.shields.io/npm/v/@jal_ai/jal)](https://www.npmjs.com/package/@jal_ai/jal)

---

## Install

```bash
npm install @jal_ai/jal
```

**Requirements:** Node.js ≥ 20, `OPENAI_API_KEY`, optional `GITHUB_TOKEN` + `GITHUB_REPO` for PR automation.

---

## 5-minute quick start

### Step 1 — Pick a product profile

```typescript
import { loadJalContext } from "@jal_ai/jal";

// Built-in: vendo | travel | generic
const jal = loadJalContext({
  JAL_PROFILE: "travel",
  JAL_PRODUCT_NAME: "Wanderly",
});
```

### Step 2 — Triage a feature request (AI PM)

```typescript
import { triageFeatureRequest } from "@jal_ai/jal";

const result = await triageFeatureRequest(
  process.env.OPENAI_API_KEY!,
  "Multi-city flight search",
  "Users want Delhi → Dubai → London in one booking flow",
  [],           // clarification thread (empty on first submit)
  "feature",
  {
    jal,
    findPriorRequests: async () => [], // optional: plug your DB here
  },
);

console.log(result.status);    // planned | already_exists | ai_review | declined
console.log(result.feedback);  // customer-facing message
console.log(result.assessment.verdict);
```

### Step 3 — Generate engineering tasks

```typescript
import { generateTasksFromAssessment } from "@jal_ai/jal";

const tasks = await generateTasksFromAssessment(
  process.env.OPENAI_API_KEY,
  shipflow,
  "Multi-city flight search",
  result.assessment,
);
// → [{ title, description }, ...]
```

### Step 4 — AI code builder + open GitHub PR

```typescript
import { runAiCodeBuilder, githubConfigFromEnv } from "@jal_ai/jal";

const github = githubConfigFromEnv({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO: "your-org/your-repo",
});

if (github && process.env.OPENAI_API_KEY) {
  const build = await runAiCodeBuilder({
    openAiApiKey: process.env.OPENAI_API_KEY,
    github,
    jal,
    featureId: "feat-001",
    featureTitle: "Multi-city flight search",
    description: "...",
    assessment: result.assessment,
    taskTitles: tasks.map((t) => t.title),
  });

  console.log(build.prUrl);   // GitHub PR link
  console.log(build.summary);
}
```

### Step 5 — AI QA review + merge PR

```typescript
import {
  reviewPullRequestAgainstPrd,
  fetchPullRequestDiff,
  mergePullRequest,
} from "@jal_ai/jal";

const diff = await fetchPullRequestDiff(github!, build.prNumber);

const review = await reviewPullRequestAgainstPrd(
  process.env.OPENAI_API_KEY,
  shipflow,
  {
    featureTitle: "Multi-city flight search",
    assessment: result.assessment,
    prDiff: diff,
    taskTitles: tasks.map((t) => t.title),
  },
);

if (review.verdict === "pass") {
  await mergePullRequest(github!, build.prNumber, {
    title: "feat: multi-city flight search",
    message: "Jal: human approved",
  });
}
```

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `JAL_PROFILE` | `vendo` · `travel` · `generic` |
| `JAL_PRODUCT_NAME` | Display name shown to AI |
| `JAL_PRODUCT_CONTEXT` | Markdown — what your product does |
| `JAL_STACK_CONTEXT` | Tech stack hints for code builder |
| `JAL_EXISTING_FEATURES` | JSON catalog for "already exists" detection |
| `JAL_OUT_OF_SCOPE` | Comma-separated terms to auto-decline |
| `JAL_USER_LABELS` | Primary users for clarification questions |
| `JAL_FEEDBACK_URL` | Link when feature already exists |
| `OPENAI_API_KEY` | Required for AI steps |
| `GITHUB_TOKEN` | PR create / merge (needs `contents` + `pull_requests`) |
| `GITHUB_REPO` | `owner/repo` — no `.git` suffix |

### Custom product (any domain)

```bash
JAL_PROFILE=generic
JAL_PRODUCT_CONTEXT="We are a health-tech app for doctors..."
JAL_STACK_CONTEXT="FastAPI + PostgreSQL + React Native..."
JAL_EXISTING_FEATURES=[{"keywords":["appointment"],"name":"Booking","url":"/book","description":"..."}]
```

---

## Built-in profiles

| Profile | Domain | Example features detected |
|---------|--------|---------------------------|
| `vendo` | Supplier onboarding | WhatsApp invites, GST, scorecards |
| `travel` | Travel booking | Flights, hotels, itineraries |
| `generic` | Any SaaS | Dashboard, settings, feedback |

---

## Duplicate detection

Pass prior requests from your database:

```typescript
await triageFeatureRequest(apiKey, title, desc, [], "feature", {
  shipflow,
  excludeRequestId: currentId,
  findPriorRequests: async (excludeId) => {
    return db.query(
      "SELECT id, title, description, status FROM feature_requests WHERE buyer_id = ?",
      [buyerId],
    );
  },
});
```

Returns `already_exists` if the same feature was shipped or is in-flight.

---

## API exports

| Module | Functions |
|--------|-----------|
| **config** | `loadJalContext`, `matchExistingFeature`, `jalBranding` |
| **triage** | `triageFeatureRequest`, `buildRequestContext`, `appendClarification` |
| **tasks** | `generateTasksFromAssessment` |
| **code-builder** | `runAiCodeBuilder` |
| **code-review** | `reviewPullRequestAgainstPrd` |
| **github** | `createPullRequestFromChanges`, `mergePullRequest`, `fetchPullRequestDiff` |

---

## Publish (maintainers)

```bash
cd packages/shipflow
npm login
npm run build
npm publish --access public
```

---

## Reference app

Full integration demo: [github.com/buildwithrenuka/vendo](https://github.com/buildwithrenuka/vendo) — Vendo uses Jal for buyer feature requests + internal dev queue.

---

## License

MIT © [buildwithrenuka](https://github.com/buildwithrenuka)

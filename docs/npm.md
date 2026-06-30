# npm package

Use **`@buildwithrenuka/jal`** when you want the AI pipeline inside **your own backend** — same engine as Studio, your routes, your infra.

## Install

```bash
npm install @buildwithrenuka/jal
```

Requirements: Node.js ≥ 20, `OPENAI_API_KEY`, optional `GITHUB_TOKEN` + `GITHUB_REPO`.

## Quick example

```typescript
import {
  loadJalContext,
  triageFeatureRequest,
  generateTasksFromAssessment,
  runAiCodeBuilder,
  githubConfigFromEnv,
} from "@buildwithrenuka/jal";

const jal = loadJalContext({
  JAL_PROFILE: "generic",
  JAL_PRODUCT_NAME: "My SaaS",
});

// 1. Triage
const triage = await triageFeatureRequest(
  process.env.OPENAI_API_KEY!,
  "Export to CSV",
  "Users need to download their data as CSV from the dashboard",
  [],
  "feature",
  { jal, findPriorRequests: async () => [] },
);

// 2. Tasks
const tasks = await generateTasksFromAssessment(
  process.env.OPENAI_API_KEY!,
  jal,
  "Export to CSV",
  triage.assessment,
);

// 3. Build + PR
const github = githubConfigFromEnv({
  GITHUB_TOKEN: process.env.GITHUB_TOKEN,
  GITHUB_REPO: "your-org/your-repo",
});

if (github) {
  const build = await runAiCodeBuilder(
    process.env.OPENAI_API_KEY!,
    github,
    jal,
    { title: "Export to CSV", assessment: triage.assessment, tasks },
  );
  console.log(build.prUrl);
}
```

## Context profiles

| Profile | Use case |
|---------|----------|
| `vendo` | Procurement / supplier onboarding |
| `travel` | Flights, hotels, itineraries |
| `generic` | Any SaaS — custom context |

```bash
JAL_PROFILE=travel
JAL_PRODUCT_NAME=Wanderly
```

Or fully custom via `JAL_PRODUCT_CONTEXT` and `JAL_STACK_CONTEXT`.

## Studio + npm together

Many teams use **both**:

- **Studio** — widget, river UI, quick shipping
- **npm** — custom automation, CI hooks, internal tools

Same pipeline logic lives in `packages/shipflow/`. Vendo's API is a thin adapter over it.

## Full reference

See [packages/shipflow/README.md](https://github.com/buildwithrenuka/vendo/blob/main/packages/shipflow/README.md) on GitHub.

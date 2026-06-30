# Embed the widget

The **JalWidget** is the customer surface — a floating icon in your app for feedback and status tracking.

## Get your credentials

1. Complete [Studio onboarding](/docs/studio)
2. Open `/studio/projects/:id/embed`
3. Copy **project ID** and **API key** (`jal_live_...`)

## React embed

```tsx
import { JalWidget } from "./components/studio/JalWidget";

<JalWidget
  projectId="your-project-id"
  apiKey="jal_live_..."
  productName="My App"
  placement="bottom-right"
/>
```

Copy the exact snippet from the Embed page — it includes your real IDs.

## iframe embed

Use the embed URL from the Studio Embed page:

```
http://localhost:5173/embed/:projectId
```

Good for non-React apps or marketing sites.

## What customers see

- Floating Jal icon (bottom-right by default)
- Submit **feature** or **bug** requests
- Track status: Received → AI Review → Planned → Building → Shipped
- They **never** see the dev queue or internal tools

## What you see

- Same requests as **droplets** on the [Feedback River](/docs/studio)
- Full pipeline in Studio Ship console

## Widget API (for custom UIs)

Base URL: your API at `/studio/feedback`

**Submit feedback**

```http
POST /studio/feedback
Authorization: Bearer jal_live_...
Content-Type: application/json

{
  "title": "Dark mode for settings",
  "description": "Users want a theme toggle in account settings",
  "requestType": "feature",
  "submitterEmail": "user@example.com"
}
```

**Poll status**

```http
GET /studio/feedback?id=:requestId
Authorization: Bearer jal_live_...
```

## Next

→ [API reference](/docs/api) · [Troubleshooting](/docs/troubleshooting)

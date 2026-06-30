import type { FeatureRequest } from "@vendo/shared";

const API_BASE = "/api";

async function studioRequest<T>(path: string, apiKey: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    signal: init?.signal ?? AbortSignal.timeout(15_000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Request failed");
  }
  return res.json() as Promise<T>;
}

export const studioFeedbackApi = {
  list: (apiKey: string, email?: string) =>
    studioRequest<{ requests: FeatureRequest[] }>(
      email ? `/studio/feedback?email=${encodeURIComponent(email)}` : "/studio/feedback",
      apiKey,
    ),

  submit: (
    apiKey: string,
    data: {
      title: string;
      description: string;
      requestType?: "feature" | "bug";
      submitterEmail?: string;
      currentPain?: string;
    },
  ) =>
    studioRequest<{ request: FeatureRequest }>("/studio/feedback", apiKey, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  clarify: (apiKey: string, id: string, reply: string, submitterEmail?: string) =>
    studioRequest<{ request: FeatureRequest }>(`/studio/feedback/${id}/clarify`, apiKey, {
      method: "POST",
      body: JSON.stringify({ reply, submitterEmail }),
    }),
};

export function storageKey(projectId: string, suffix: string) {
  return `jal_${projectId}_${suffix}`;
}

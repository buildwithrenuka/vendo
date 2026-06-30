import { oidcEndpoints, oidcRedirectUri, googleOAuthRedirectUri } from "./config";

export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}

/** magic-secretary style — callback lives on APP_URL (same origin as the web app) */
export function buildGoogleAuthorizationUrl(env: Env, state: string): string {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth not configured");
  }

  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: googleOAuthRedirectUri(env),
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleAuthCode(code: string, env: Env): Promise<OAuthProfile> {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth not configured");
  }

  const redirectUri = googleOAuthRedirectUri(env);
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const body = await tokenRes.text();
    throw new Error(friendlyGoogleOAuthError(body));
  }

  const tokens = (await tokenRes.json()) as { access_token?: string; id_token?: string };

  if (tokens.id_token) {
    return verifyGoogleIdToken(tokens.id_token, env.GOOGLE_CLIENT_ID);
  }

  if (tokens.access_token) {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!userInfoRes.ok) throw new Error("Failed to fetch Google profile");
    const userInfo = (await userInfoRes.json()) as { sub: string; email: string; name?: string; picture?: string };
    return { id: userInfo.sub, email: userInfo.email, name: userInfo.name, picture: userInfo.picture };
  }

  throw new Error("No token in Google response");
}

export function friendlyGoogleOAuthError(err: unknown): string {
  const message = typeof err === "string" ? err : err instanceof Error ? err.message : "OAuth callback failed";
  if (message.includes("invalid_grant")) {
    return "The authorization code has expired. Please sign in with Google again.";
  }
  if (message.includes("redirect_uri_mismatch")) {
    return "Google redirect URI mismatch — add APP_URL/auth/google/callback in Google Cloud Console.";
  }
  return message.slice(0, 200);
}

/** Optional: GSI one-tap / credential POST fallback */
export async function verifyGoogleLogin(
  body: { credential?: string; code?: string; access_token?: string },
  env: Env,
): Promise<OAuthProfile> {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new Error("Google OAuth not configured");
  }

  if (body.access_token) {
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${body.access_token}` },
    });
    if (!userInfoRes.ok) throw new Error("Invalid Google access token");
    const userInfo = (await userInfoRes.json()) as { sub: string; email: string; name?: string; picture?: string };
    return { id: userInfo.sub, email: userInfo.email, name: userInfo.name, picture: userInfo.picture };
  }

  if (body.code) {
    return exchangeGoogleAuthCode(body.code, env);
  }

  if (body.credential) {
    return verifyGoogleIdToken(body.credential, env.GOOGLE_CLIENT_ID);
  }

  throw new Error("Google credential, authorization code, or access token required");
}

async function verifyGoogleIdToken(idToken: string, clientId: string): Promise<OAuthProfile> {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
  if (!res.ok) throw new Error("Invalid Google credential");
  const payload = (await res.json()) as { sub: string; email: string; name?: string; picture?: string; aud: string };
  if (payload.aud !== clientId) throw new Error("Google token audience mismatch");
  return { id: payload.sub, email: payload.email, name: payload.name, picture: payload.picture };
}

export async function fetchSeekIdProfile(accessToken: string, env: Env): Promise<OAuthProfile> {
  const { userinfoUrl } = oidcEndpoints(env);
  const profileRes = await fetch(userinfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) throw new Error("OIDC userinfo request failed");
  const profile = (await profileRes.json()) as { sub: string; email: string; name?: string; picture?: string };
  return {
    id: profile.sub,
    email: profile.email,
    name: profile.name,
    picture: profile.picture,
  };
}

export async function exchangeSeekIdCode(code: string, env: Env): Promise<{ access_token: string }> {
  const { tokenUrl } = oidcEndpoints(env);
  const tokenRes = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: oidcRedirectUri(env),
      client_id: env.OIDC_CLIENT_ID,
      client_secret: env.OIDC_CLIENT_SECRET,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`OIDC token exchange failed: ${err}`);
  }

  return tokenRes.json() as Promise<{ access_token: string }>;
}

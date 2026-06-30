/** SeekID / Poll-Seeker OIDC endpoints derived from OIDC_ISSUER */
export function oidcEndpoints(env: Env) {
  const issuer = env.OIDC_ISSUER?.replace(/\/$/, "") ?? "";
  return {
    issuer,
    authorizationUrl: env.OIDC_AUTHORIZATION_URL || `${issuer}/oidc/auth`,
    tokenUrl: env.OIDC_TOKEN_URL || `${issuer}/oidc/token`,
    userinfoUrl: env.OIDC_USERINFO_URL || `${issuer}/oidc/userinfo`,
  };
}

/** magic-secretary pattern: OAuth callback on the public app origin */
export function googleOAuthRedirectUri(env: Env): string {
  return `${env.APP_URL.replace(/\/$/, "")}/auth/google/callback`;
}

export function oidcRedirectUri(env: Env): string {
  return `${env.APP_URL.replace(/\/$/, "")}/callback`;
}

export function apiUrl(env: Env): string {
  return env.API_URL ?? "http://localhost:8787";
}

/** True when running against localhost — relaxes buyer email checks for local testing */
export function isLocalDev(env: Env): boolean {
  const appUrl = env.APP_URL.replace(/\/$/, "");
  return appUrl.startsWith("http://localhost") || appUrl.startsWith("http://127.0.0.1");
}

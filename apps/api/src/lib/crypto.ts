const encoder = new TextEncoder();

export async function sha256Hex(input: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(input));
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomToken(bytes = 32): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  return [...buffer].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hashInviteToken(token: string): Promise<string> {
  return sha256Hex(`invite:${token}`);
}

export async function hashSessionToken(token: string, secret: string): Promise<string> {
  return sha256Hex(`session:${secret}:${token}`);
}

export async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  if (aBytes.length !== bBytes.length) return false;
  return crypto.subtle.timingSafeEqual(aBytes, bBytes);
}

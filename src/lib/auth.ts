export const AUTH_PROFILES = [
  { id: "dev", username: "devteam", password: "nivra-dev", label: "Dev Team" },
  { id: "client", username: "client", password: "nivra-client", label: "Client" },
] as const;

export type AuthProfileId = (typeof AUTH_PROFILES)[number]["id"];

export const SESSION_COOKIE = "nivra-session";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

function getAuthSecret(): string {
  return process.env.AUTH_SECRET ?? "nivra-local-dev-secret";
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const pad = value.length % 4 === 0 ? "" : "=".repeat(4 - (value.length % 4));
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/") + pad;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(profileId: AuthProfileId): Promise<string> {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `${profileId}:${expiresAt}`;
  const payloadBytes = new TextEncoder().encode(payload);
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${toBase64Url(payloadBytes)}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined,
): Promise<AuthProfileId | null> {
  if (!token) return null;

  const [encodedPayload, encodedSignature] = token.split(".");
  if (!encodedPayload || !encodedSignature) return null;

  const payloadBytes = fromBase64Url(encodedPayload);
  const signatureBytes = fromBase64Url(encodedSignature);
  const payload = new TextDecoder().decode(payloadBytes);

  const key = await getSigningKey();
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    Uint8Array.from(signatureBytes),
    Uint8Array.from(payloadBytes),
  );
  if (!valid) return null;

  const [profileId, expiresAtRaw] = payload.split(":");
  const expiresAt = Number(expiresAtRaw);
  if (!profileId || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return null;
  }

  const profile = AUTH_PROFILES.find((p) => p.id === profileId);
  return profile ? profile.id : null;
}

export function authenticateUser(
  username: string,
  password: string,
): AuthProfileId | null {
  const profile = AUTH_PROFILES.find(
    (p) => p.username === username && p.password === password,
  );
  return profile ? profile.id : null;
}

export function getSessionCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  };
}

export function getProfileLabel(profileId: AuthProfileId): string {
  return AUTH_PROFILES.find((p) => p.id === profileId)?.label ?? profileId;
}

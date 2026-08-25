import crypto from "crypto";

const DEFAULT_TTL_MINUTES = 480; // 8 horas

function base64urlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64urlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const padded = padding ? normalized + "=".repeat(4 - padding) : normalized;
  return Buffer.from(padded, "base64").toString("utf8");
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;

  if (!secret || secret.length < 32) {
    const error = new Error("SESSION_SECRET ausente ou muito curto");
    error.code = "SESSION_SECRET_NOT_CONFIGURED";
    throw error;
  }

  return secret;
}

function getTtlMinutes() {
  const raw = Number(process.env.SESSION_TTL_MINUTES);
  if (Number.isFinite(raw) && raw >= 15 && raw <= 1440) {
    return Math.floor(raw);
  }
  return DEFAULT_TTL_MINUTES;
}

function sign(unsignedToken, secret) {
  return crypto
    .createHmac("sha256", secret)
    .update(unsignedToken)
    .digest("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

export function createSessionToken(username) {
  const secret = getSessionSecret();
  const now = Math.floor(Date.now() / 1000);
  const ttlSeconds = getTtlMinutes() * 60;

  const header = {
    alg: "HS256",
    typ: "JWT"
  };

  const payload = {
    sub: username,
    iat: now,
    exp: now + ttlSeconds,
    iss: "sla-pulse-api"
  };

  const encodedHeader = base64urlEncode(JSON.stringify(header));
  const encodedPayload = base64urlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = sign(unsignedToken, secret);

  return {
    token: `${unsignedToken}.${signature}`,
    expiresAt: new Date((now + ttlSeconds) * 1000).toISOString()
  };
}

export function verifySessionToken(token) {
  if (typeof token !== "string" || !token.trim()) {
    const error = new Error("Token ausente");
    error.code = "TOKEN_MISSING";
    throw error;
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    const error = new Error("Token inválido");
    error.code = "TOKEN_INVALID";
    throw error;
  }

  const [encodedHeader, encodedPayload, receivedSignature] = parts;
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const secret = getSessionSecret();
  const expectedSignature = sign(unsignedToken, secret);

  const a = Buffer.from(receivedSignature);
  const b = Buffer.from(expectedSignature);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    const error = new Error("Assinatura inválida");
    error.code = "TOKEN_INVALID";
    throw error;
  }

  let header;
  let payload;

  try {
    header = JSON.parse(base64urlDecode(encodedHeader));
    payload = JSON.parse(base64urlDecode(encodedPayload));
  } catch {
    const error = new Error("Token inválido");
    error.code = "TOKEN_INVALID";
    throw error;
  }

  if (header?.alg !== "HS256" || header?.typ !== "JWT") {
    const error = new Error("Token inválido");
    error.code = "TOKEN_INVALID";
    throw error;
  }

  if (payload?.iss !== "sla-pulse-api" || typeof payload?.sub !== "string") {
    const error = new Error("Token inválido");
    error.code = "TOKEN_INVALID";
    throw error;
  }

  const now = Math.floor(Date.now() / 1000);
  if (!Number.isFinite(payload.exp) || payload.exp <= now) {
    const error = new Error("Sessão expirada");
    error.code = "TOKEN_EXPIRED";
    throw error;
  }

  return payload;
}

export function getBearerToken(req) {
  const authorization = req.headers?.authorization || "";
  const match = /^Bearer\s+(.+)$/i.exec(authorization);
  return match ? match[1].trim() : "";
}

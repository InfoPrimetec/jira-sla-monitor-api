import { getBearerToken, verifySessionToken } from "../lib/session.js";
import { findUserByUsername, publicUser } from "../lib/users.js";

function setHeaders(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");
}

export default function handler(req, res) {
  setHeaders(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({
      authorized: false,
      error: "method_not_allowed"
    });
  }

  try {
    const token = getBearerToken(req);
    const payload = verifySessionToken(token);

    // Reconsulta o cadastro a cada validação.
    // Assim, bloquear o usuário no users.json invalida o acesso
    // mesmo que o token ainda não tenha expirado.
    const user = findUserByUsername(payload.sub);

    if (!user) {
      return res.status(401).json({
        authorized: false,
        reason: "user_not_found"
      });
    }

    if (!user.active) {
      return res.status(403).json({
        authorized: false,
        reason: "user_disabled"
      });
    }

    return res.status(200).json({
      authorized: true,
      user: publicUser(user),
      session: {
        expiresAt: new Date(payload.exp * 1000).toISOString()
      }
    });
  } catch (error) {
    const code = error?.code || "";

    if (code === "SESSION_SECRET_NOT_CONFIGURED") {
      return res.status(503).json({
        authorized: false,
        error: "server_not_configured"
      });
    }

    if (code === "TOKEN_EXPIRED") {
      return res.status(401).json({
        authorized: false,
        reason: "session_expired"
      });
    }

    if (code === "TOKEN_MISSING" || code === "TOKEN_INVALID") {
      return res.status(401).json({
        authorized: false,
        reason: "invalid_session"
      });
    }

    console.error("Session validation error:", error?.message || "unknown");

    return res.status(500).json({
      authorized: false,
      error: "internal_error"
    });
  }
}

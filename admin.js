import crypto from "crypto";
import { getBearerToken, verifySessionToken } from "./session.js";
import { findUserByUsername } from "./users.js";

export function normalizeUsername(value) {
  return String(value || "").trim().toLowerCase();
}

export function requireAdmin(req) {
  const payload = verifySessionToken(getBearerToken(req));
  const user = findUserByUsername(payload.sub);

  if (!user) {
    const error = new Error("User not found");
    error.code = "USER_NOT_FOUND";
    throw error;
  }

  if (!user.active) {
    const error = new Error("User disabled");
    error.code = "USER_DISABLED";
    throw error;
  }

  if (user.role !== "admin") {
    const error = new Error("Admin required");
    error.code = "ADMIN_REQUIRED";
    throw error;
  }

  return user;
}

export function validateUsername(username) {
  return /^[a-z0-9._-]{3,40}$/.test(username);
}

export function createPasswordFields(password) {
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    const error = new Error("Invalid password");
    error.code = "INVALID_PASSWORD";
    throw error;
  }

  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64, {
    N: 16384,
    r: 8,
    p: 1
  });

  return {
    salt: salt.toString("base64"),
    passwordHash: hash.toString("base64")
  };
}

export function publicAdminUser(user) {
  return {
    username: user.username,
    name: user.name,
    role: user.role,
    active: Boolean(user.active)
  };
}

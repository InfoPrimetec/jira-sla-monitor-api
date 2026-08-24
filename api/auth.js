import fs from "fs";
import path from "path";
import crypto from "crypto";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "no-store");
}

function verifyPassword(password, saltBase64, hashBase64) {
  const salt = Buffer.from(saltBase64, "base64");
  const storedHash = Buffer.from(hashBase64, "base64");

  const calculatedHash = crypto.scryptSync(password, salt, storedHash.length, {
    N: 16384,
    r: 8,
    p: 1
  });

  if (calculatedHash.length !== storedHash.length) {
    return false;
  }

  return crypto.timingSafeEqual(calculatedHash, storedHash);
}

export default function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      authorized: false,
      error: "method_not_allowed"
    });
  }

  const { username, password } = req.body || {};

  if (
    typeof username !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !password
  ) {
    return res.status(400).json({
      authorized: false,
      error: "missing_credentials"
    });
  }

  try {
    const filePath = path.join(process.cwd(), "data", "users.json");
    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const normalizedUsername = username.trim().toLowerCase();

    const user = data.users.find(
      (item) =>
        typeof item.username === "string" &&
        item.username.trim().toLowerCase() === normalizedUsername
    );

    if (!user) {
      return res.status(401).json({
        authorized: false,
        reason: "invalid_credentials"
      });
    }

    if (!user.active) {
      return res.status(403).json({
        authorized: false,
        reason: "user_disabled"
      });
    }

    const passwordOk = verifyPassword(
      password,
      user.salt,
      user.passwordHash
    );

    if (!passwordOk) {
      return res.status(401).json({
        authorized: false,
        reason: "invalid_credentials"
      });
    }

    return res.status(200).json({
      authorized: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Auth error:", error);

    return res.status(500).json({
      authorized: false,
      error: "internal_error"
    });
  }
}

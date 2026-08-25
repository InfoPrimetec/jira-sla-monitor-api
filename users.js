import {
  createPasswordFields,
  normalizeUsername,
  publicAdminUser,
  requireAdmin,
  validateUsername
} from "../../lib/admin.js";
import {
  readUsersFileFromGitHub,
  writeUsersFileToGitHub
} from "../../lib/github.js";

function headers(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Cache-Control", "no-store");
}

function authFailure(res, error) {
  const map = {
    TOKEN_EXPIRED: [401, "session_expired"],
    TOKEN_MISSING: [401, "invalid_session"],
    TOKEN_INVALID: [401, "invalid_session"],
    USER_NOT_FOUND: [401, "user_not_found"],
    USER_DISABLED: [403, "user_disabled"],
    ADMIN_REQUIRED: [403, "admin_required"]
  };

  const item = map[error?.code];
  if (!item) return false;

  res.status(item[0]).json({ ok: false, reason: item[1] });
  return true;
}

function indexOfUser(users, username) {
  const wanted = normalizeUsername(username);
  return users.findIndex((u) => normalizeUsername(u.username) === wanted);
}

export default async function handler(req, res) {
  headers(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  let admin;
  try {
    admin = requireAdmin(req);
  } catch (error) {
    if (authFailure(res, error)) return;

    if (error?.code === "SESSION_SECRET_NOT_CONFIGURED") {
      return res.status(503).json({ ok: false, error: "server_not_configured" });
    }

    console.error("Admin auth:", error?.code || error?.message || "unknown");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }

  try {
    const { users, sha } = await readUsersFileFromGitHub();

    if (req.method === "GET") {
      return res.status(200).json({
        ok: true,
        users: users
          .map(publicAdminUser)
          .sort((a, b) => a.username.localeCompare(b.username))
      });
    }

    if (req.method === "POST") {
      const username = normalizeUsername(req.body?.username);
      const name = String(req.body?.name || "").trim();
      const role = req.body?.role === "admin" ? "admin" : "user";
      const active = req.body?.active !== false;

      if (!validateUsername(username)) {
        return res.status(400).json({ ok: false, error: "invalid_username" });
      }

      if (!name || name.length > 100) {
        return res.status(400).json({ ok: false, error: "invalid_name" });
      }

      if (indexOfUser(users, username) >= 0) {
        return res.status(409).json({ ok: false, error: "username_already_exists" });
      }

      const passwordFields = createPasswordFields(req.body?.password);

      const newUser = {
        username,
        name,
        role,
        active,
        ...passwordFields
      };

      users.push(newUser);

      await writeUsersFileToGitHub(
        users,
        sha,
        `SLA Pulse: create user ${username}`
      );

      return res.status(201).json({
        ok: true,
        user: publicAdminUser(newUser),
        deploymentPending: true
      });
    }

    if (req.method === "PATCH") {
      const targetUsername = normalizeUsername(req.body?.username);
      const index = indexOfUser(users, targetUsername);

      if (index < 0) {
        return res.status(404).json({ ok: false, error: "user_not_found" });
      }

      const target = users[index];
      const self =
        normalizeUsername(admin.username) === normalizeUsername(target.username);

      if (typeof req.body?.name === "string") {
        const name = req.body.name.trim();
        if (!name || name.length > 100) {
          return res.status(400).json({ ok: false, error: "invalid_name" });
        }
        target.name = name;
      }

      if (typeof req.body?.active === "boolean") {
        if (self && req.body.active === false) {
          return res.status(400).json({ ok: false, error: "cannot_disable_self" });
        }
        target.active = req.body.active;
      }

      if (req.body?.role === "admin" || req.body?.role === "user") {
        if (self && req.body.role !== "admin") {
          return res.status(400).json({ ok: false, error: "cannot_demote_self" });
        }

        if (target.role === "admin" && req.body.role === "user") {
          const activeAdmins = users.filter((u) => u.active && u.role === "admin");
          if (activeAdmins.length <= 1) {
            return res.status(400).json({ ok: false, error: "cannot_remove_last_admin" });
          }
        }

        target.role = req.body.role;
      }

      if (typeof req.body?.password === "string" && req.body.password) {
        Object.assign(target, createPasswordFields(req.body.password));
      }

      await writeUsersFileToGitHub(
        users,
        sha,
        `SLA Pulse: update user ${target.username}`
      );

      return res.status(200).json({
        ok: true,
        user: publicAdminUser(target),
        deploymentPending: true
      });
    }

    if (req.method === "DELETE") {
      const targetUsername = normalizeUsername(
        req.body?.username || req.query?.username
      );
      const index = indexOfUser(users, targetUsername);

      if (index < 0) {
        return res.status(404).json({ ok: false, error: "user_not_found" });
      }

      const target = users[index];
      const self =
        normalizeUsername(admin.username) === normalizeUsername(target.username);

      if (self) {
        return res.status(400).json({ ok: false, error: "cannot_delete_self" });
      }

      if (target.role === "admin" && target.active) {
        const activeAdmins = users.filter((u) => u.active && u.role === "admin");
        if (activeAdmins.length <= 1) {
          return res.status(400).json({ ok: false, error: "cannot_remove_last_admin" });
        }
      }

      users.splice(index, 1);

      await writeUsersFileToGitHub(
        users,
        sha,
        `SLA Pulse: delete user ${target.username}`
      );

      return res.status(200).json({
        ok: true,
        deleted: target.username,
        deploymentPending: true
      });
    }

    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  } catch (error) {
    if (error?.code === "GITHUB_NOT_CONFIGURED") {
      return res.status(503).json({ ok: false, error: "github_not_configured" });
    }

    if (error?.code === "INVALID_PASSWORD") {
      return res.status(400).json({ ok: false, error: "invalid_password" });
    }

    if (error?.code === "GITHUB_API_ERROR") {
      console.error("GitHub API:", error.status, error.message);
      return res.status(502).json({ ok: false, error: "github_api_error" });
    }

    console.error("Admin users:", error?.message || "unknown");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

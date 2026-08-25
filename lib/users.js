import fs from "fs";
import path from "path";

export function loadUsers() {
  const filePath = path.join(process.cwd(), "data", "users.json");
  const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));

  if (!parsed || !Array.isArray(parsed.users)) {
    throw new Error("Arquivo de usuários inválido");
  }

  return parsed.users;
}

export function findUserByUsername(username) {
  if (typeof username !== "string") return null;

  const normalized = username.trim().toLowerCase();

  return (
    loadUsers().find(
      (user) =>
        typeof user.username === "string" &&
        user.username.trim().toLowerCase() === normalized
    ) || null
  );
}

export function publicUser(user) {
  return {
    username: user.username,
    name: user.name,
    role: user.role
  };
}

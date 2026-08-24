import fs from "fs";
import path from "path";

export default function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).json({
      authorized: false,
      error: "method_not_allowed"
    });
  }

  const { email } = req.query;

  if (!email || typeof email !== "string") {
    return res.status(400).json({
      authorized: false,
      error: "email_required"
    });
  }

  try {
    const filePath = path.join(process.cwd(), "data", "users.json");
    const file = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(file);

    const normalizedEmail = email.trim().toLowerCase();

    const user = data.users.find(
      (item) => item.email.trim().toLowerCase() === normalizedEmail
    );

    if (!user) {
      return res.status(403).json({
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    console.error("Failed to read users.json:", error);
    return res.status(500).json({
      authorized: false,
      error: "internal_server_error"
    });
  }
}

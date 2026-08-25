export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    status: "online",
    project: "SLA Pulse API",
    version: "1.3.0",
    auth: "session-token"
  });
}

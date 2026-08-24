export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    status: "online",
    project: "Jira SLA Monitor API",
    version: "1.1.0"
  });
}

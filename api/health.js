export default function handler(req, res) {
  res.status(200).json({
    status: "online",
    project: "Jira SLA Monitor API",
    version: "1.0.0"
  });
}

const GITHUB_API = "https://api.github.com";

function config() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || "main";

  if (!token || !owner || !repo) {
    const error = new Error("GitHub integration is not configured");
    error.code = "GITHUB_NOT_CONFIGURED";
    throw error;
  }

  return { token, owner, repo, branch };
}

async function githubRequest(path, options = {}) {
  const { token } = config();

  const response = await fetch(`${GITHUB_API}${path}`, {
    ...options,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sla-pulse-api",
      ...(options.headers || {})
    }
  });

  const text = await response.text();
  let data = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const error = new Error(data?.message || `GitHub HTTP ${response.status}`);
    error.code = "GITHUB_API_ERROR";
    error.status = response.status;
    throw error;
  }

  return data;
}

function decodeBase64(value) {
  return Buffer.from(String(value || "").replace(/\n/g, ""), "base64").toString("utf8");
}

export async function readUsersFileFromGitHub() {
  const { owner, repo, branch } = config();
  const endpoint =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/contents/data/users.json?ref=${encodeURIComponent(branch)}`;

  const file = await githubRequest(endpoint, { method: "GET" });
  const parsed = JSON.parse(decodeBase64(file.content));

  if (!parsed || !Array.isArray(parsed.users)) {
    throw new Error("Invalid data/users.json");
  }

  return { users: parsed.users, sha: file.sha };
}

export async function writeUsersFileToGitHub(users, sha, message) {
  const { owner, repo, branch } = config();
  const endpoint =
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
    `/contents/data/users.json`;

  const content = Buffer.from(
    JSON.stringify({ users }, null, 2) + "\n",
    "utf8"
  ).toString("base64");

  return githubRequest(endpoint, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content,
      sha,
      branch
    })
  });
}

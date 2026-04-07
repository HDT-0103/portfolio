import { NextResponse } from "next/server";

function parseGithubRepoUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname !== "github.com") return null;
    const parts = u.pathname.split("/").filter(Boolean);
    if (parts.length < 2) return null;
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, "");
    if (!owner || !repo) return null;
    return { owner, repo };
  } catch {
    return null;
  }
}

function base64ToUtf8(b64: string): string {
  const bin = Buffer.from(b64, "base64");
  return bin.toString("utf8");
}

async function githubFetch(path: string, init?: RequestInit) {
  const token = process.env.GITHUB_TOKEN;
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/vnd.github+json");
  headers.set("x-github-api-version", "2022-11-28");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const res = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers,
    next: { revalidate: 600 },
  });
  return res;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") ?? "";
  const parsed = parseGithubRepoUrl(url);
  if (!parsed) {
    return NextResponse.json(
      { error: "Invalid GitHub repo url" },
      { status: 400 },
    );
  }

  const { owner, repo } = parsed;

  const repoRes = await githubFetch(`/repos/${owner}/${repo}`);
  if (!repoRes.ok) {
    const text = await repoRes.text();
    return NextResponse.json(
      { error: `GitHub repo fetch failed: ${repoRes.status}`, details: text },
      { status: 502 },
    );
  }
  const repoJson = (await repoRes.json()) as any;
  const defaultBranch =
    typeof repoJson?.default_branch === "string"
      ? repoJson.default_branch
      : "main";
  const repoHtmlUrl =
    typeof repoJson?.html_url === "string"
      ? repoJson.html_url
      : `https://github.com/${owner}/${repo}`;

  const readmeRes = await githubFetch(`/repos/${owner}/${repo}/readme`);

  if (!readmeRes.ok) {
    const text = await readmeRes.text();
    return NextResponse.json(
      { error: `GitHub readme fetch failed: ${readmeRes.status}`, details: text },
      { status: 502 },
    );
  }

  const readmeJson = (await readmeRes.json()) as any;
  const content =
    typeof readmeJson?.content === "string" ? readmeJson.content : "";
  const encoding =
    typeof readmeJson?.encoding === "string" ? readmeJson.encoding : "base64";
  const path = typeof readmeJson?.path === "string" ? readmeJson.path : "README.md";

  const markdown =
    encoding === "base64" && content ? base64ToUtf8(content) : "";

  const dir = path.includes("/") ? path.split("/").slice(0, -1).join("/") : "";
  const baseRawDir = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}${
    dir ? `/${dir}/` : "/"
  }`;
  const baseRepoDir = `${repoHtmlUrl}/blob/${defaultBranch}${
    dir ? `/${dir}/` : "/"
  }`;

  return NextResponse.json({
    markdown,
    repo: `${owner}/${repo}`,
    defaultBranch,
    baseRawDir,
    baseRepoDir,
  });
}

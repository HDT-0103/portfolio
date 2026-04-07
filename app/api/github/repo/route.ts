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

function extractFirstImageFromReadme(markdown: string): string | null {
  // ![alt](url) or <img src="url" ...>
  const mdMatch = markdown.match(/!\[[^\]]*?\]\((https?:\/\/[^)\s]+)\)/i);
  if (mdMatch?.[1]) return mdMatch[1];

  const htmlMatch = markdown.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (htmlMatch?.[1]) return htmlMatch[1];

  return null;
}

function stripMarkdown(md: string): string {
  return (
    md
      // remove code blocks
      .replace(/```[\s\S]*?```/g, " ")
      // images
      .replace(/!\[[^\]]*?\]\([^)]+\)/g, " ")
      // links -> keep label
      .replace(/\[([^\]]+?)\]\([^)]+\)/g, "$1")
      // inline code
      .replace(/`([^`]+?)`/g, "$1")
      // headings/bullets symbols
      .replace(/^\s{0,3}#{1,6}\s+/gm, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      // blockquotes
      .replace(/^\s*>\s?/gm, "")
      // html tags
      .replace(/<[^>]+>/g, " ")
      // whitespace
      .replace(/\s+/g, " ")
      .trim()
  );
}

function deriveDescriptionFromReadme(readmeMd: string, maxLen = 220): string | null {
  // Split into blocks and pick the first paragraph-like block.
  const blocks = readmeMd
    .split(/\n\s*\n/g)
    .map((b) => b.trim())
    .filter(Boolean);

  for (const block of blocks) {
    // Skip titles/badges/images-heavy blocks
    if (/^\s{0,3}#{1,6}\s+/m.test(block)) continue;
    if (/(shields\.io|badge|badges)/i.test(block) && block.length < 200) continue;
    if (/^!\[[^\]]*?\]\([^)]+\)\s*$/m.test(block)) continue;

    const text = stripMarkdown(block);
    if (!text) continue;
    // Require some letters/numbers so we don't pick noise
    if (!/[A-Za-zÀ-ỹ0-9]/.test(text)) continue;

    const shortened = text.length > maxLen ? `${text.slice(0, maxLen - 1)}…` : text;
    return shortened;
  }

  return null;
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
    // cache repo info briefly to reduce rate limit pressure
    next: { revalidate: 300 },
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

  // Topics require a preview accept header in older APIs; many accounts accept with default now.
  // We'll do a second fetch with explicit accept for topics to be safe.
  const topicsRes = await githubFetch(`/repos/${owner}/${repo}/topics`, {
    headers: { accept: "application/vnd.github+json" },
  });
  const topicsJson = topicsRes.ok ? await topicsRes.json() : null;

  let readmeMd: string | null = null;
  let imageUrlSuggestion: string | null = null;

  const readmeRes = await githubFetch(`/repos/${owner}/${repo}/readme`, {
    headers: { accept: "application/vnd.github.raw+json" },
  });
  if (readmeRes.ok) {
    readmeMd = await readmeRes.text();
    imageUrlSuggestion = extractFirstImageFromReadme(readmeMd);
  }

  const title = (repoJson?.name as string | undefined) ?? repo;
  const repoDescription =
    typeof repoJson?.description === "string" ? repoJson.description.trim() : "";
  const derivedFromReadme =
    readmeMd && (!repoDescription || repoDescription.length < 10)
      ? deriveDescriptionFromReadme(readmeMd)
      : null;
  const description =
    (repoDescription || derivedFromReadme || "No description yet.") as string;
  const homepage = (repoJson?.homepage as string | undefined) ?? null;

  const tags = Array.isArray(topicsJson?.names)
    ? (topicsJson.names as unknown[]).filter((t) => typeof t === "string")
    : [];

  return NextResponse.json({
    repo: {
      owner,
      name: repo,
      full_name: repoJson?.full_name ?? `${owner}/${repo}`,
      html_url: repoJson?.html_url ?? url,
      homepage,
      stargazers_count: repoJson?.stargazers_count ?? 0,
      forks_count: repoJson?.forks_count ?? 0,
      language: repoJson?.language ?? null,
      pushed_at: repoJson?.pushed_at ?? null,
    },
    suggestedProject: {
      title,
      description,
      tags,
      github_url: repoJson?.html_url ?? url,
      demo_url: homepage,
      image_url: imageUrlSuggestion,
    },
  });
}

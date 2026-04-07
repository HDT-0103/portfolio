function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function isSafeUrl(url: string): boolean {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("#") ||
    url.startsWith("/")
  );
}

type RenderOptions = {
  baseRepoDir?: string;
  baseRawDir?: string;
};

function resolveRelativeUrl(url: string, baseDir: string): string {
  if (!baseDir) return url;
  if (isSafeUrl(url)) return url;

  const base = baseDir.endsWith("/") ? baseDir : `${baseDir}/`;
  const u = url.replace(/^\.?\//, "");

  // Resolve ../ segments (best-effort)
  const baseParts = base.split("/").filter(Boolean);
  const urlParts = url.split("/").filter(Boolean);
  while (urlParts[0] === "..") {
    urlParts.shift();
    baseParts.pop();
  }
  while (urlParts[0] === ".") urlParts.shift();

  const prefix = base.startsWith("https://") ? "https://" : base.startsWith("http://") ? "http://" : "";
  if (prefix) {
    // Rebuild absolute for https://.../a/b/
    const [protocol, , host, ...rest] = base.split("/");
    const absoluteBase = `${protocol}//${host}/${rest.filter(Boolean).join("/")}`;
    const normalizedBase = absoluteBase.endsWith("/")
      ? absoluteBase
      : `${absoluteBase}/`;
    return `${normalizedBase}${urlParts.join("/")}`;
  }

  return `${base}${u}`;
}

function autolink(text: string): string {
  return text.replace(
    /\bhttps?:\/\/[^\s<]+[^\s<\.)\]]/g,
    (m) =>
      `<a href="${escapeHtml(m)}" target="_blank" rel="noreferrer" class="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">${escapeHtml(m)}</a>`,
  );
}

function linkify(text: string, opts: RenderOptions): string {
  // [label](url)
  const withLinks = text.replace(
    /\[([^\]]+?)\]\(([^)\s]+)\)/g,
    (_m, label: string, url: string) => {
      const resolved = isSafeUrl(url)
        ? url
        : resolveRelativeUrl(url, opts.baseRepoDir ?? "");
      if (!isSafeUrl(resolved) && !resolved.startsWith("http")) return label;
      const safeUrl = escapeHtml(resolved);
      const safeLabel = label;
      const target = safeUrl.startsWith("#") ? "" : ' target="_blank" rel="noreferrer"';
      return `<a href="${safeUrl}"${target} class="text-cyan-300 hover:text-cyan-200 underline underline-offset-2">${safeLabel}</a>`;
    },
  );

  return autolink(withLinks);
}

function formatInline(text: string, opts: RenderOptions): string {
  let out = text;
  // inline code
  out = out.replace(/`([^`]+?)`/g, (_m, code: string) => {
    return `<code class="px-1 py-0.5 rounded bg-slate-900/70 border border-slate-800 text-slate-100">${code}</code>`;
  });
  // bold
  out = out.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  // strikethrough
  out = out.replace(/~~([^~]+?)~~/g, "<del>$1</del>");
  // italic (simple)
  out = out.replace(/\*([^*\n]+?)\*/g, "<em>$1</em>");
  out = linkify(out, opts);
  return out;
}

function renderImages(line: string, opts: RenderOptions): string {
  // Render images: ![alt](url)
  return line.replace(
    /!\[([^\]]*?)\]\(([^)\s]+)\)/g,
    (_m, alt: string, url: string) => {
      const resolved = isSafeUrl(url)
        ? url
        : resolveRelativeUrl(url, opts.baseRawDir ?? "");
      if (!isSafeUrl(resolved) && !resolved.startsWith("http")) return "";
      return `<img src="${escapeHtml(
        resolved,
      )}" alt="${escapeHtml(
        alt,
      )}" loading="lazy" class="max-w-full rounded-xl border border-slate-800 bg-slate-950/30" />`;
    },
  );
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);
}

function splitTableRow(line: string): string[] {
  const trimmed = line.trim();
  const noEdges = trimmed.replace(/^\|/, "").replace(/\|$/, "");
  return noEdges.split("|").map((c) => c.trim());
}

function renderTable(
  headerLine: string,
  sepLine: string,
  bodyLines: string[],
  opts: RenderOptions,
): string {
  const headers = splitTableRow(headerLine);
  const aligns = splitTableRow(sepLine).map((c) => {
    const left = c.startsWith(":");
    const right = c.endsWith(":");
    if (left && right) return "text-center";
    if (right) return "text-right";
    return "text-left";
  });

  const thead = `<thead><tr>${headers
    .map((h, i) => {
      const cls = aligns[i] ?? "text-left";
      return `<th class="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 border-b border-slate-800 ${cls}">${formatInline(
        h,
        opts,
      )}</th>`;
    })
    .join("")}</tr></thead>`;

  const tbodyRows = bodyLines
    .map((line) => {
      const cells = splitTableRow(line);
      return `<tr class="border-b border-slate-900/60">${headers
        .map((_h, i) => {
          const cls = aligns[i] ?? "text-left";
          const cell = cells[i] ?? "";
          return `<td class="px-3 py-2 text-sm text-slate-200 ${cls}">${formatInline(
            cell,
            opts,
          )}</td>`;
        })
        .join("")}</tr>`;
    })
    .join("");

  const tbody = `<tbody>${tbodyRows}</tbody>`;

  return `<div class="overflow-auto rounded-xl border border-slate-800 bg-slate-950/20"><table class="min-w-full">${thead}${tbody}</table></div>`;
}

export function markdownToSafeHtml(markdown: string, opts: RenderOptions = {}): string {
  // Escape first so HTML in README can't execute.
  const escaped = escapeHtml(markdown);

  // Extract fenced code blocks so we don't format inside them.
  const codeBlocks: string[] = [];
  let text = escaped.replace(/```([\s\S]*?)```/g, (_m, code: string) => {
    const idx = codeBlocks.length;
    codeBlocks.push(code.trimEnd());
    return `@@CODEBLOCK_${idx}@@`;
  });

  const lines = text.split("\n");
  const html: string[] = [];
  let inUl = false;
  let inOl = false;
  let inQuote = false;
  const quoteLines: string[] = [];

  const closeLists = () => {
    if (inUl) {
      html.push("</ul>");
      inUl = false;
    }
    if (inOl) {
      html.push("</ol>");
      inOl = false;
    }
  };

  const flushQuote = () => {
    if (!inQuote) return;
    const content = quoteLines
      .map((l) => l.replace(/^\s*>\s?/, ""))
      .filter(Boolean)
      .map((l) => `<p class="text-slate-200">${formatInline(renderImages(l, opts), opts)}</p>`)
      .join("");
    html.push(
      `<blockquote class="border-l-2 border-cyan-400/50 pl-4 py-1 my-3 text-slate-200/90">${content}</blockquote>`,
    );
    quoteLines.length = 0;
    inQuote = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.replace(/\s+$/g, "");

    // Tables (GFM)
    const next = lines[i + 1]?.replace(/\s+$/g, "") ?? "";
    if (line.includes("|") && isTableSeparator(next)) {
      flushQuote();
      closeLists();
      const body: string[] = [];
      i += 2;
      while (i < lines.length) {
        const row = lines[i].replace(/\s+$/g, "");
        if (!row.trim() || !row.includes("|")) break;
        body.push(row);
        i++;
      }
      i--; // compensate for loop increment
      html.push(renderTable(line, next, body, opts));
      continue;
    }

    // Blockquotes (consecutive > lines)
    if (/^\s*>\s?/.test(line)) {
      flushQuote();
      inQuote = true;
      quoteLines.push(line);
      // also capture subsequent quote lines in same run
      while (i + 1 < lines.length && /^\s*>\s?/.test(lines[i + 1])) {
        i++;
        quoteLines.push(lines[i].replace(/\s+$/g, ""));
      }
      flushQuote();
      continue;
    }

    // Horizontal rule
    if (/^\s*(---|\*\*\*|___)\s*$/.test(line)) {
      flushQuote();
      closeLists();
      html.push('<hr class="border-slate-800 my-4" />');
      continue;
    }

    const codeMatch = line.match(/^@@CODEBLOCK_(\d+)@@$/);
    if (codeMatch) {
      flushQuote();
      closeLists();
      const code = codeBlocks[Number(codeMatch[1])] ?? "";
      html.push(
        `<pre class="overflow-auto rounded-xl bg-slate-950/60 border border-slate-800 p-4 text-sm"><code>${code}</code></pre>`,
      );
      continue;
    }

    if (!line.trim()) {
      flushQuote();
      closeLists();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushQuote();
      closeLists();
      const level = heading[1].length;
      const content = formatInline(renderImages(heading[2], opts), opts);
      const size =
        level === 1
          ? "text-2xl"
          : level === 2
            ? "text-xl"
            : level === 3
              ? "text-lg"
              : "text-base";
      html.push(
        `<h${level} class="text-white font-bold ${size} mt-6 mb-2">${content}</h${level}>`,
      );
      continue;
    }

    const taskItem = line.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)$/);
    if (taskItem) {
      flushQuote();
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul class="list-none pl-0 space-y-1">');
        inUl = true;
      }
      const checked = taskItem[1].toLowerCase() === "x";
      html.push(
        `<li class="text-slate-200 flex items-start gap-2"><input type="checkbox" ${
          checked ? "checked" : ""
        } disabled class="mt-1 accent-cyan-400" /><span>${formatInline(
          renderImages(taskItem[2], opts),
          opts,
        )}</span></li>`,
      );
      continue;
    }

    const ulItem = line.match(/^\s*[-*+]\s+(.*)$/);
    if (ulItem) {
      flushQuote();
      if (inOl) {
        html.push("</ol>");
        inOl = false;
      }
      if (!inUl) {
        html.push('<ul class="list-disc pl-6 space-y-1">');
        inUl = true;
      }
      html.push(
        `<li class="text-slate-200">${formatInline(
          renderImages(ulItem[1], opts),
          opts,
        )}</li>`,
      );
      continue;
    }

    const olItem = line.match(/^\s*\d+\.\s+(.*)$/);
    if (olItem) {
      flushQuote();
      if (inUl) {
        html.push("</ul>");
        inUl = false;
      }
      if (!inOl) {
        html.push('<ol class="list-decimal pl-6 space-y-1">');
        inOl = true;
      }
      html.push(
        `<li class="text-slate-200">${formatInline(
          renderImages(olItem[1], opts),
          opts,
        )}</li>`,
      );
      continue;
    }

    const maybeImageOnly = renderImages(line, opts);
    if (maybeImageOnly !== line && maybeImageOnly.trim() === "") {
      continue;
    }

    closeLists();
    html.push(
      `<p class="text-slate-200 leading-relaxed">${formatInline(
        renderImages(line, opts),
        opts,
      )}</p>`,
    );
  }

  flushQuote();
  closeLists();
  return html.join("\n");
}

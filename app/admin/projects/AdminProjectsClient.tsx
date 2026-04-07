"use client";

import React, { useEffect, useMemo, useState } from "react";

type ProjectRow = {
  id: string;
  title: string;
  description: string;
  tags: string[] | null;
  image_url: string;
  github_url: string | null;
  demo_url: string | null;
  featured: boolean;
  sort_order: number;
  status: "draft" | "published";
  created_at?: string;
  updated_at?: string;
};

type Draft = {
  id?: string;
  title: string;
  desc: string;
  tags: string;
  image_url: string;
  github_url: string;
  demo_url: string;
  featured: boolean;
  sort_order: number;
  status: "draft" | "published";
};

function toDraft(p?: ProjectRow | null): Draft {
  return {
    id: p?.id,
    title: p?.title ?? "",
    desc: p?.description ?? "",
    tags: (p?.tags ?? []).join(", "),
    image_url: p?.image_url ?? "",
    github_url: p?.github_url ?? "",
    demo_url: p?.demo_url ?? "",
    featured: p?.featured ?? true,
    sort_order: p?.sort_order ?? 0,
    status: p?.status ?? "published",
  };
}

export default function AdminProjectsClient() {
  const [adminToken, setAdminToken] = useState("");
  const [loadedToken, setLoadedToken] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>(toDraft(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("admin_token") ?? "";
    setAdminToken(saved);
    setLoadedToken(true);
  }, []);

  const selected = useMemo(
    () => projects.find((p) => p.id === selectedId) ?? null,
    [projects, selectedId],
  );

  async function loadProjects(token = adminToken) {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/projects", {
        headers: token ? { "x-admin-token": token } : {},
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed to load projects");
      setProjects(Array.isArray(json?.projects) ? json.projects : []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function importFromGithub() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!githubUrl.trim()) throw new Error("Missing GitHub URL");
      const res = await fetch(
        `/api/github/repo?url=${encodeURIComponent(githubUrl.trim())}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "GitHub fetch failed");

      const suggested = json?.suggestedProject ?? null;
      if (!suggested) throw new Error("No suggestedProject returned");

      setDraft((d) => ({
        ...d,
        title: typeof suggested.title === "string" ? suggested.title : d.title,
        desc:
          typeof suggested.description === "string"
            ? suggested.description
            : d.desc,
        tags: Array.isArray(suggested.tags)
          ? suggested.tags.join(", ")
          : d.tags,
        github_url:
          typeof suggested.github_url === "string"
            ? suggested.github_url
            : d.github_url,
        demo_url:
          typeof suggested.demo_url === "string"
            ? suggested.demo_url
            : d.demo_url,
        image_url:
          typeof suggested.image_url === "string"
            ? suggested.image_url
            : d.image_url,
      }));

      setSuccess("Imported data from GitHub. Review and Save.");
    } catch (e: any) {
      setError(e?.message ?? "GitHub import failed");
    } finally {
      setLoading(false);
    }
  }

  async function syncAllFromGithub() {
    setError(null);
    setSuccess(null);
    setSyncing(true);
    try {
      if (!adminToken) throw new Error("Missing ADMIN_TOKEN");

      const list = projects.filter((p) => typeof p.github_url === "string" && p.github_url);
      if (list.length === 0) throw new Error("No projects with GitHub URL to sync");

      for (const p of list) {
        const url = p.github_url ?? "";
        const res = await fetch(
          `/api/github/repo?url=${encodeURIComponent(url)}`,
          { cache: "no-store" },
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "GitHub fetch failed");

        const suggested = json?.suggestedProject ?? null;
        if (!suggested) continue;

        const payload = {
          title: typeof suggested.title === "string" ? suggested.title : p.title,
          desc:
            typeof suggested.description === "string"
              ? suggested.description
              : p.description,
          tags: Array.isArray(suggested.tags)
            ? suggested.tags.join(", ")
            : (p.tags ?? []).join(", "),
          demo_url:
            typeof suggested.demo_url === "string"
              ? suggested.demo_url
              : p.demo_url,
          // Keep existing image if admin curated it
          image_url: p.image_url,
        };

        const patch = await fetch(`/api/projects/${p.id}`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
            "x-admin-token": adminToken,
          },
          body: JSON.stringify(payload),
        });
        const patchJson = await patch.json();
        if (!patch.ok) {
          throw new Error(patchJson?.error || `Sync failed for ${p.title}`);
        }
      }

      setSuccess("Synced projects from GitHub.");
      await loadProjects(adminToken);
    } catch (e: any) {
      setError(e?.message ?? "Sync failed");
    } finally {
      setSyncing(false);
    }
  }

  useEffect(() => {
    if (!loadedToken) return;
    if (!adminToken) return;
    loadProjects(adminToken);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadedToken]);

  function pickProject(p: ProjectRow) {
    setSelectedId(p.id);
    setDraft(toDraft(p));
    setSuccess(null);
    setError(null);
  }

  function newProject() {
    setSelectedId(null);
    setDraft(toDraft(null));
    setSuccess(null);
    setError(null);
  }

  async function save() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!adminToken) throw new Error("Missing ADMIN_TOKEN");

      const payload = {
        title: draft.title,
        desc: draft.desc,
        tags: draft.tags,
        image_url: draft.image_url,
        github_url: draft.github_url || null,
        demo_url: draft.demo_url || null,
        featured: draft.featured,
        sort_order: Number.isFinite(draft.sort_order) ? draft.sort_order : 0,
        status: draft.status,
      };

      const isEdit = Boolean(draft.id);
      const url = isEdit ? `/api/projects/${draft.id}` : "/api/projects";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "content-type": "application/json",
          "x-admin-token": adminToken,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Save failed");

      setSuccess(isEdit ? "Updated project." : "Created project.");
      await loadProjects(adminToken);

      const saved = (json?.project ?? null) as ProjectRow | null;
      if (saved?.id) {
        setSelectedId(saved.id);
        setDraft(toDraft(saved));
      }
    } catch (e: any) {
      setError(e?.message ?? "Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function remove() {
    if (!draft.id) return;
    // eslint-disable-next-line no-alert
    const ok = window.confirm("Delete this project?");
    if (!ok) return;

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      if (!adminToken) throw new Error("Missing ADMIN_TOKEN");
      const res = await fetch(`/api/projects/${draft.id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Delete failed");
      setSuccess("Deleted project.");
      await loadProjects(adminToken);
      newProject();
    } catch (e: any) {
      setError(e?.message ?? "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-white text-3xl font-bold">Admin · Projects</h1>
            <p className="text-slate-400 text-sm mt-1">
              Manage Featured Projects from Supabase.
            </p>
          </div>
          <a
            className="text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
            href="/"
          >
            ← Back to site
          </a>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <div className="p-4 border-b border-slate-800">
              <label className="text-[11px] uppercase tracking-wider text-slate-500">
                Admin Token
              </label>
              <div className="mt-2 flex gap-2">
                <input
                  value={adminToken}
                  onChange={(e) => setAdminToken(e.target.value)}
                  placeholder="ADMIN_TOKEN"
                  className="flex-1 h-10 rounded-lg bg-slate-950/60 border border-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/60"
                />
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("admin_token", adminToken);
                    loadProjects(adminToken);
                  }}
                  className="h-10 px-4 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
                  disabled={!adminToken || loading}
                >
                  Load
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <button
                  type="button"
                  onClick={newProject}
                  className="text-sm text-slate-200 hover:text-white transition-colors"
                >
                  + New project
                </button>
                <button
                  type="button"
                  onClick={syncAllFromGithub}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-60"
                  disabled={!adminToken || loading || syncing}
                  title="Refresh title/description/tags/demo from GitHub"
                >
                  {syncing ? "Syncing…" : "Sync from GitHub"}
                </button>
                <button
                  type="button"
                  onClick={() => loadProjects(adminToken)}
                  className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  disabled={!adminToken || loading}
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="p-2">
              {loading && (
                <div className="p-3 text-sm text-slate-400">Loading…</div>
              )}
              {!loading && projects.length === 0 && (
                <div className="p-3 text-sm text-slate-400">
                  No projects found.
                </div>
              )}
              <div className="space-y-2">
                {projects.map((p) => {
                  const active = p.id === selectedId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => pickProject(p)}
                      className={`w-full text-left p-3 rounded-xl border transition ${
                        active
                          ? "border-cyan-400/60 bg-cyan-400/10"
                          : "border-slate-800 bg-slate-950/20 hover:bg-slate-950/40"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-white font-semibold text-sm">
                            {p.title}
                          </div>
                          <div className="text-[11px] text-slate-500 mt-1">
                            {p.status} · order {p.sort_order}
                            {p.featured ? " · featured" : ""}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="lg:col-span-3 rounded-2xl border border-slate-800 bg-slate-900/30 overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="text-white font-bold">
                  {selected ? "Edit project" : "Create project"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Changes save to Supabase via server-side API.
                </div>
              </div>
              {draft.id && (
                <button
                  type="button"
                  onClick={remove}
                  className="text-sm text-red-300 hover:text-red-200 transition-colors"
                  disabled={loading}
                >
                  Delete
                </button>
              )}
            </div>

            <div className="p-5 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold text-sm">
                      Import from GitHub
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      Paste a GitHub repo URL to prefill fields.
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <input
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    placeholder="https://github.com/owner/repo"
                    className="flex-1 h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/60"
                  />
                  <button
                    type="button"
                    onClick={importFromGithub}
                    disabled={loading || !githubUrl.trim()}
                    className="h-11 px-4 rounded-lg border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
                  >
                    Fetch
                  </button>
                </div>
                <div className="text-[11px] text-slate-500 mt-2">
                  Tip: image auto-detect uses the first image in README (if any).
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
                  {success}
                </div>
              )}

              <div className="grid sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Title
                  </label>
                  <input
                    value={draft.title}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, title: e.target.value }))
                    }
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Description
                  </label>
                  <textarea
                    value={draft.desc}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, desc: e.target.value }))
                    }
                    rows={4}
                    className="mt-2 w-full rounded-lg bg-slate-950/50 border border-slate-800 px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Tags (comma-separated)
                  </label>
                  <input
                    value={draft.tags}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, tags: e.target.value }))
                    }
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                    placeholder="Web App, Security, Cloud"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Image URL
                  </label>
                  <input
                    value={draft.image_url}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, image_url: e.target.value }))
                    }
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                    placeholder="/images/my-project.png"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    GitHub URL
                  </label>
                  <input
                    value={draft.github_url}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, github_url: e.target.value }))
                    }
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Demo URL
                  </label>
                  <input
                    value={draft.demo_url}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, demo_url: e.target.value }))
                    }
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Sort order
                  </label>
                  <input
                    value={String(draft.sort_order)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        sort_order: Number(e.target.value || 0),
                      }))
                    }
                    type="number"
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                  />
                </div>

                <div>
                  <label className="text-[11px] uppercase tracking-wider text-slate-500">
                    Status
                  </label>
                  <select
                    value={draft.status}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        status: e.target.value as Draft["status"],
                      }))
                    }
                    className="mt-2 w-full h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-400/60"
                  >
                    <option value="published">published</option>
                    <option value="draft">draft</option>
                  </select>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                  <input
                    id="featured"
                    type="checkbox"
                    checked={draft.featured}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, featured: e.target.checked }))
                    }
                    className="h-4 w-4"
                  />
                  <label htmlFor="featured" className="text-sm text-slate-200">
                    Featured on homepage
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDraft(toDraft(selected));
                    setSuccess(null);
                    setError(null);
                  }}
                  className="h-11 px-4 rounded-lg border border-slate-700 text-slate-200 hover:text-white hover:border-slate-500 transition disabled:opacity-60"
                  disabled={loading}
                >
                  Reset
                </button>
                <button
                  type="button"
                  onClick={save}
                  className="h-11 px-5 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:brightness-110 transition disabled:opacity-60"
                  disabled={loading}
                >
                  {loading ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

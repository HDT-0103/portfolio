"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { X, ExternalLink, Github } from "lucide-react";
import { markdownToSafeHtml } from "../lib/markdown";

type ReadmeModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  githubUrl?: string | null;
  demoUrl?: string | null;
};

export default function ReadmeModal({
  open,
  onClose,
  title,
  githubUrl,
  demoUrl,
}: ReadmeModalProps) {
  const [markdown, setMarkdown] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [baseRepoDir, setBaseRepoDir] = useState<string>("");
  const [baseRawDir, setBaseRawDir] = useState<string>("");
  const panelRef = useRef<HTMLDivElement>(null);

  const html = useMemo(() => {
    if (!markdown) return "";
    return markdownToSafeHtml(markdown, { baseRepoDir, baseRawDir });
  }, [markdown, baseRepoDir, baseRawDir]);

  useEffect(() => {
    if (!open) return;
    setMarkdown("");
    setError(null);
    setBaseRepoDir("");
    setBaseRawDir("");
    if (!githubUrl) {
      setError("This project does not have a GitHub repository link.");
      return;
    }

    setLoading(true);
    fetch(`/api/github/readme?url=${encodeURIComponent(githubUrl)}`, {
      cache: "force-cache",
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load README");
        setMarkdown(typeof json?.markdown === "string" ? json.markdown : "");
        setBaseRepoDir(typeof json?.baseRepoDir === "string" ? json.baseRepoDir : "");
        setBaseRawDir(typeof json?.baseRawDir === "string" ? json.baseRawDir : "");
      })
      .catch((e: any) => setError(e?.message ?? "Failed to load README"))
      .finally(() => setLoading(false));
  }, [open, githubUrl]);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} README`}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/70"
      />

      <div
        ref={panelRef}
        tabIndex={-1}
        className="relative w-full max-w-3xl max-h-[90vh] outline-none rounded-2xl border border-slate-800 bg-[#0B1120] shadow-2xl overflow-hidden"
      >
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-white font-bold text-lg truncate">{title}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {githubUrl && (
                <a
                  href={githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-400/60 transition"
                >
                  <Github size={16} /> GitHub
                </a>
              )}
              {demoUrl && (
                <a
                  href={demoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-slate-700 text-slate-200 hover:text-cyan-300 hover:border-cyan-400/60 transition"
                >
                  <ExternalLink size={16} /> Demo
                </a>
              )}
            </div>
          </div>

          <button
            type="button"
            aria-label="Close modal"
            onClick={onClose}
            className="shrink-0 w-10 h-10 rounded-xl border border-slate-700 bg-slate-950/30 text-slate-200 hover:text-white hover:border-cyan-400/60 transition inline-flex items-center justify-center"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-auto max-h-[calc(90vh-88px)]">
          {loading && <div className="text-slate-400 text-sm">Loading…</div>}
          {!loading && error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
          {!loading && !error && !markdown && (
            <div className="text-slate-400 text-sm">No README found.</div>
          )}

          {!loading && !error && markdown && (
            <article
              className="space-y-3 [&_a]:break-words [&_code]:break-words [&_pre]:leading-relaxed [&_pre_code]:break-normal [&_img]:my-3"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

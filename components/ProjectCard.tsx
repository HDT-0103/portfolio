"use client";
import React from "react";
import { motion } from "framer-motion";
import { Github, ExternalLink } from "lucide-react";
import { glass } from "./SharedUI";

type ProjectCardProps = {
  title: string;
  desc: string;
  tags: string[];
  imageUrl: string;
  githubUrl?: string | null;
  demoUrl?: string | null;
  onOpen?: () => void;
};

export default function ProjectCard({
  title,
  desc,
  tags,
  imageUrl,
  githubUrl,
  demoUrl,
  onOpen,
}: ProjectCardProps) {
  return (
    <motion.article
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
      className={`${glass} overflow-hidden hover:border-cyan-400/50 ${
        onOpen ? "cursor-pointer" : ""
      }`}
      role={onOpen ? "button" : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
    >
      <div className="h-52 sm:h-56 w-full relative overflow-hidden bg-slate-800/50">
        <img
          src={imageUrl}
          alt={title}
          className="w-full h-full object-cover border-b border-slate-800/50"
          loading="lazy"
        />
      </div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-white text-xl font-semibold">{title}</h3>
          <div className="flex items-center gap-2">
            {githubUrl && (
              <a
                href={githubUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full border border-slate-700 hover:border-cyan-400/60 text-slate-200 hover:text-cyan-400 inline-flex items-center justify-center transition"
              >
                <Github size={15} />
              </a>
            )}
            {demoUrl && (
              <a
                href={demoUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-8 h-8 rounded-full border border-slate-700 hover:border-cyan-400/60 text-slate-200 hover:text-cyan-400 inline-flex items-center justify-center transition"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>
        </div>
        <p className="text-slate-400 text-sm leading-relaxed mb-4">{desc}</p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag: string) => (
            <span
              key={tag}
              className="text-[11px] px-2.5 py-1 rounded-full bg-cyan-400/10 text-cyan-300 border border-cyan-400/20"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}

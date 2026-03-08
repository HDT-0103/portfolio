"use client";
import React from "react";
import { motion } from "framer-motion";

export const glass =
  "bg-slate-900/50 border border-slate-800 backdrop-blur-md rounded-2xl";

export const sectionEnter = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45, ease: "easeOut" as const },
};

export function NavItem({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
    >
      {children}
    </a>
  );
}

export function InfoCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className={`${glass} p-4 hover:border-cyan-400/50`}
    >
      <div className="mb-3 text-cyan-400">{icon}</div>
      <h4 className="text-white text-sm font-semibold mb-1">{title}</h4>
      <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
    </motion.div>
  );
}

export function SkillCard({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub?: string;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 260, damping: 18 }}
      className={`${glass} p-5 text-center hover:border-cyan-400/50`}
    >
      <div className="w-9 h-9 mx-auto mb-3 rounded-lg bg-cyan-400/10 text-cyan-400 flex items-center justify-center">
        {icon}
      </div>
      <h4 className="text-white text-sm font-semibold">{title}</h4>
      {sub ? <p className="text-[11px] text-slate-400 mt-1">{sub}</p> : null}
    </motion.div>
  );
}

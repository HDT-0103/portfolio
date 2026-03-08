"use client";
import React from "react";
import { motion } from "framer-motion";
import { Award, ExternalLink } from "lucide-react";
import { glass } from "./SharedUI";

export default function CertCard({ title, issuer, date, verifyUrl }: any) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 240, damping: 20 }}
      className={`${glass} p-5 flex items-start gap-4 hover:border-cyan-400/50`}
    >
      <div className="w-12 h-12 shrink-0 rounded-xl bg-cyan-400/10 text-cyan-400 flex items-center justify-center border border-cyan-400/20">
        <Award size={24} />
      </div>

      <div className="flex-1">
        <h3 className="text-white font-semibold text-base sm:text-lg leading-tight">
          {title}
        </h3>
        <p className="text-cyan-300 text-sm mt-1">{issuer}</p>

        <div className="flex items-center justify-between mt-4">
          <span className="text-slate-500 text-xs px-2 py-1 rounded-md bg-slate-900 border border-slate-800">
            {date}
          </span>
          {verifyUrl && verifyUrl !== "#" && (
            <a
              href={verifyUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1 text-xs font-medium"
            >
              Xác minh <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

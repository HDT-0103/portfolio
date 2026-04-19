"use client";

import React, { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { CERTIFICATIONS_DATA } from "../data";
import CertCard from "../components/CertCard";
import {
  glass,
  sectionEnter,
  NavItem,
  InfoCard,
  SkillCard,
} from "../components/SharedUI";
import ProjectCard from "../components/ProjectCard";
import type { Project } from "../lib/types";
import ReadmeModal from "../components/ReadmeModal";
import {
  Menu,
  Mail,
  MapPin,
  Github,
  Linkedin,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Cloud,
  Network,
  Gauge,
  Server,
  CodeXml,
  MessageSquare,
} from "lucide-react";

export default function HomePageClient({ projects }: { projects: Project[] }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");
    try {
      const { error } = await supabase
        .from("contact_messages")
        .insert([formData]);
      if (error) throw error;
      setSubmitStatus("success");
      setFormData({ name: "", email: "", subject: "", message: "" });
      setTimeout(() => setSubmitStatus("idle"), 3000);
    } catch (_err) {
      setSubmitStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const carouselRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: "left" | "right") => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({
        left: direction === "left" ? -420 : 420,
        behavior: "smooth",
      });
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null;

  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <ReadmeModal
          open={Boolean(activeProject)}
          onClose={() => setActiveProjectId(null)}
          title={activeProject?.title ?? ""}
          githubUrl={activeProject?.githubUrl ?? null}
          demoUrl={activeProject?.demoUrl ?? null}
        />
        <a
          href="#top"
          className="sr-only focus:not-sr-only focus:inline-block focus:mt-4 focus:mb-3 focus:px-4 focus:py-2 focus:rounded-lg focus:bg-cyan-500 focus:text-slate-950"
        >
          Skip to content
        </a>
        <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0B1120]/80 border-b border-slate-900/80">
          <div className="h-16 flex items-center justify-between">
            <a
              href="#top"
              className="text-white font-extrabold tracking-tight text-lg"
            >
              <span className="text-cyan-400">Ho Dinh Tri</span>
            </a>
            <nav className="hidden md:flex items-center gap-6">
              <NavItem href="#about">About</NavItem>
              <NavItem href="#skills">Skills</NavItem>
              <NavItem href="#projects">Projects</NavItem>
              <NavItem href="#certifications">Certificates</NavItem>
              <NavItem href="#timeline">Education</NavItem>
              <NavItem href="#contact">Contact</NavItem>
            </nav>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Open navigation menu"
                aria-expanded={mobileNavOpen}
                onClick={() => setMobileNavOpen((v) => !v)}
                className="md:hidden w-9 h-9 rounded-lg border border-slate-800 text-slate-200 inline-flex items-center justify-center"
              >
                <Menu size={16} />
              </button>
            </div>
          </div>
          {mobileNavOpen && (
            <div className="md:hidden border-t border-slate-900/80 bg-[#0B1120]/95">
              <div className="px-4 py-3 flex flex-col gap-2">
                {[
                  ["#about", "About"],
                  ["#skills", "Skills"],
                  ["#projects", "Projects"],
                  ["#certifications", "Certificates"],
                  ["#timeline", "Education"],
                  ["#contact", "Contact"],
                ].map(([href, label]) => (
                  <a
                    key={href}
                    href={href}
                    onClick={() => setMobileNavOpen(false)}
                    className="px-3 py-2 rounded-lg text-slate-200 hover:bg-slate-900/60 hover:text-white transition"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          )}
        </header>

        <motion.section
          id="top"
          {...sectionEnter}
          className="pt-10 sm:pt-14 grid md:grid-cols-2 gap-8 md:gap-12 items-center"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] text-cyan-300 border border-cyan-400/40 rounded-full px-3 py-1 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> READY
              FOR NEW CHALLENGES
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight text-white">
              Hi, I’m <span className="text-cyan-400">Tri</span>
            </h1>
            <p className="text-slate-400 mt-4 max-w-xl leading-relaxed">
              Computer Science student at the University of Science. Passionate
              about Cybersecurity, Cloud Computing, and Network Administration.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-semibold text-sm hover:brightness-110 hover:scale-[1.03] transition"
              >
                Contact Me
              </a>
              <a
                href="#projects"
                className="px-5 py-2.5 rounded-xl border border-cyan-400/50 text-cyan-300 font-semibold text-sm hover:bg-cyan-400/10 hover:scale-[1.03] transition"
              >
                View Projects
              </a>
            </div>
          </div>
          <div className="relative">
            <motion.div
              whileHover={{ scale: 1.01 }}
              className={`${glass} p-3 sm:p-4 max-w-md ml-auto shadow-[0_0_40px_rgba(14,165,233,0.12)]`}
            >
              <div className="h-77.5 sm:h-85 rounded-2xl bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-800 flex items-center justify-center">
                <img
                  src="/avatar.jpeg"
                  alt="Ho Dinh Tri"
                  className="w-[86%] h-[86%] rounded-2xl object-cover border border-cyan-500/20 shadow-lg"
                />
              </div>
            </motion.div>
          </div>
        </motion.section>

        <motion.section id="about" {...sectionEnter} className="mt-20">
          <div className="grid lg:grid-cols-5 gap-5">
            <div className={`lg:col-span-2 ${glass} p-6`}>
              <h2 className="text-white text-2xl font-bold mb-4">About Me</h2>
              <p className="text-slate-400 text-sm leading-relaxed mb-3">
                Currently studying at the University of Science, I aim to become
                a secure systems specialist, focused on infrastructure
                optimization and cybersecurity.
              </p>
            </div>
            <div className="lg:col-span-3 grid sm:grid-cols-2 gap-4">
              <InfoCard
                icon={<ShieldCheck size={18} />}
                title="Security First"
                desc="Security mindset in every line of code."
              />
              <InfoCard
                icon={<Cloud size={18} />}
                title="Cloud Native"
                desc="Experience building flexible cloud infrastructure."
              />
              <InfoCard
                icon={<Network size={18} />}
                title="Networking"
                desc="Designing and managing network systems."
              />
              <InfoCard
                icon={<Gauge size={18} />}
                title="Optimization"
                desc="Optimizing performance and architecture."
              />
            </div>
          </div>
        </motion.section>

        <motion.section id="skills" {...sectionEnter} className="mt-20">
          <h2 className="text-center text-white text-3xl font-bold mb-8">
            Core Skills
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <SkillCard icon={<ShieldCheck size={18} />} title="Cybersecurity" />
            <SkillCard icon={<Network size={18} />} title="Networking" />
            <SkillCard icon={<Server size={18} />} title="Systems" />
            <SkillCard icon={<CodeXml size={18} />} title="Coding" />
            <SkillCard
              icon={<MessageSquare size={18} />}
              title="Communicating"
            />
          </div>
        </motion.section>

        <motion.section id="projects" {...sectionEnter} className="mt-20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white text-3xl font-bold">Featured Projects</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition"
                aria-label="Scroll projects left"
                type="button"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full border border-slate-700 bg-slate-900/50 text-slate-300 hover:text-cyan-400 flex items-center justify-center transition"
                aria-label="Scroll projects right"
                type="button"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          <div className="relative w-full">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory gap-5 pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {projects.map((project) => (
                <div
                  key={project.id}
                  className="min-w-[85vw] sm:min-w-100 max-w-100 snap-center shrink-0"
                >
                  <ProjectCard
                    title={project.title}
                    desc={project.desc}
                    tags={project.tags}
                    imageUrl={project.imageUrl}
                    githubUrl={project.githubUrl}
                    demoUrl={project.demoUrl}
                    onOpen={() => setActiveProjectId(project.id)}
                  />
                </div>
              ))}
              {projects.length === 0 && (
                <div className={`${glass} p-6 text-slate-300`}>
                  No projects yet.
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <motion.section id="certifications" {...sectionEnter} className="mt-20">
          <h2 className="text-white text-3xl font-bold mb-8">
            Licenses & Certifications
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {CERTIFICATIONS_DATA.map((cert) => (
              <CertCard key={cert.id} {...cert} />
            ))}
          </div>
        </motion.section>

        {/* Timeline section unchanged */}
        <motion.section id="timeline" {...sectionEnter} className="mt-20">
          <h2 className="text-white text-3xl font-bold mb-8">
            Learning Journey
          </h2>
          <div className="relative pl-8 sm:pl-12">
            <div className="absolute left-3 sm:left-5 top-1 bottom-1 w-px bg-slate-700" />
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute -left-8 sm:-left-10 top-6 w-5 h-5 rounded-full border-2 border-cyan-400 bg-[#0B1120]" />
                <div className={`${glass} p-5`}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="text-cyan-300 font-semibold">
                      University of Science (VNUHCM)
                    </h3>
                    <span className="text-[11px] text-slate-500">
                      2024–2028
                    </span>
                  </div>
                  <p className="text-white text-sm font-medium">
                    Bachelor&apos;s in Computer Science
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    Strong focus on security fundamentals, networking and
                    systems.
                  </p>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -left-8 sm:-left-10 top-6 w-5 h-5 rounded-full border-2 border-cyan-400 bg-[#0B1120]" />
                <div className={`${glass} p-5`}>
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h3 className="text-cyan-300 font-semibold">
                      Preparing for ISC2 CC
                    </h3>
                    <span className="text-[11px] text-slate-500">Current</span>
                  </div>
                  <p className="text-white text-sm font-medium">
                    Entry-level security certification
                  </p>
                  <p className="text-slate-400 text-xs mt-2">
                    Focusing on core security principles, risk management, and
                    network security.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section id="contact" {...sectionEnter} className="mt-20">
          <div className={`${glass} p-8 grid md:grid-cols-5 gap-10`}>
            <div className="md:col-span-2 space-y-6">
              <div>
                <h2 className="text-white text-3xl font-bold mb-2">
                  Contact me
                </h2>
                <p className="text-slate-400 text-sm">
                  Do you have an idea and need to connect? Don&apos;t hesitate!
                </p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                    <Mail size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                      Email
                    </p>
                    <a
                      className="font-medium text-sm hover:text-cyan-300 transition-colors"
                      href="mailto:hodinhtri3010@gmail.com"
                    >
                      hodinhtri3010@gmail.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-slate-300">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-cyan-400">
                    <MapPin size={18} />
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 uppercase tracking-wider">
                      Location
                    </p>
                    <p className="font-medium text-sm">Ho Chi Minh, Vietnam</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <a
                  href="https://github.com/HDT-0103"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white flex items-center justify-center transition-colors"
                  aria-label="GitHub profile"
                >
                  <Github size={18} />
                </a>
                <a
                  href="https://www.linkedin.com/in/trihodinh/"
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 h-10 rounded-full bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-white flex items-center justify-center transition-colors"
                  aria-label="LinkedIn profile"
                >
                  <Linkedin size={18} />
                </a>
              </div>
            </div>

            <form
              className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3"
              onSubmit={handleFormSubmit}
            >
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your name"
                required
                className="sm:col-span-1 h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
              />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Email"
                required
                className="sm:col-span-1 h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
              />
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="Title"
                className="sm:col-span-2 h-11 rounded-lg bg-slate-950/50 border border-slate-800 px-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
              />
              <textarea
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Message Content..."
                rows={4}
                required
                className="sm:col-span-2 rounded-lg bg-slate-950/50 border border-slate-800 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-400/60"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="sm:col-span-2 h-11 rounded-lg bg-cyan-500 text-slate-950 text-sm font-semibold hover:brightness-110 hover:scale-[1.01] transition disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
              {submitStatus === "success" && (
                <p className="sm:col-span-2 text-green-400 text-xs text-center mt-1">
                  Message sent successfully!
                </p>
              )}
              {submitStatus === "error" && (
                <p className="sm:col-span-2 text-red-400 text-xs text-center mt-1">
                  An error occurred, please try again.
                </p>
              )}
            </form>
          </div>
        </motion.section>

        <footer className="mt-14 pt-7 border-t border-slate-900 text-center">
          <div className="text-sm text-white font-semibold">
            <span className="text-cyan-400">Ho Dinh Tri</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            © 2026 Ho Dinh Tri. Designed with passion for Tech &amp; Security.
          </p>
        </footer>
      </div>
    </main>
  );
}

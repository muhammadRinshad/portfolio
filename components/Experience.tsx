"use client";

import { motion } from "framer-motion";

const experiences = [
    {
        id: 1,
        role: "Freelance Full-Stack Developer",
        company: "Independent",
        period: "2024 – Present",
        type: "Freelance",
        description:
            "Designed and developed full-stack web applications for clients. Delivered educational platforms, branding pages for Haris & Co Academy schools, and e-commerce solutions using Next.js and the MERN stack.",
        skills: ["Next.js", "React", "Node.js", "MongoDB", "Framer Motion", "TypeScript"],
    },
    {
        id: 2,
        role: "MERN Stack Trainee",
        company: "Haris & Co Academy, Calicut",
        period: "Jun 2025 – Jan 2026",
        type: "Training",
        description:
            "Intensive full-stack training covering the complete MERN stack. Built real-world projects including a social media app, music playlist app, and shopping cart app from scratch.",
        skills: ["MongoDB", "Express.js", "React", "Node.js", "REST APIs"],
    },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const typeColor: Record<string, string> = {
    Freelance:   "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
    Training:    "text-sky-400 bg-sky-400/10 border-sky-400/25",
    "Full-Time": "text-violet-400 bg-violet-400/10 border-violet-400/25",
};

export default function Experience() {
    return (
        <section
            id="experience"
            className="w-full bg-transparent"
            style={{ padding: "clamp(3rem, 6vw, 6rem) 0" }}
        >
            <div className="section-content">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.65, ease }}
                    className="flex items-end justify-between mb-12"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "2rem" }}
                >
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-[1px] w-10 bg-gray-cool" />
                            <span className="text-gray-cool font-mono text-xs tracking-widest uppercase">
                                Career
                            </span>
                        </div>
                        <h2
                            className="font-display font-black text-ivory leading-none"
                            style={{ fontSize: "clamp(2.2rem, 4.5vw, 4.5rem)" }}
                        >
                            MY
                            <br />
                            <span className="text-gray-cool opacity-50">EXPERIENCE</span>
                        </h2>
                    </div>
                    <span
                        className="font-display font-black text-ivory/5 leading-none select-none hidden sm:block"
                        style={{ fontSize: "clamp(4rem, 8vw, 8rem)" }}
                    >
                        0{experiences.length}
                    </span>
                </motion.div>

                {/* Entries */}
                <div className="flex flex-col">
                    {experiences.map((item, i) => (
                        <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 28 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, amount: 0.15 }}
                            transition={{ duration: 0.6, ease, delay: i * 0.12 }}
                            className="group grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 lg:gap-16 py-10 lg:py-12"
                            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                            {/* Left — period + type badge */}
                            <div className="flex lg:flex-col gap-3 lg:gap-4 lg:pt-1 flex-wrap">
                                <span className="font-mono text-[11px] tracking-widest text-ivory/40 uppercase whitespace-nowrap">
                                    {item.period}
                                </span>
                                <span
                                    className={`self-start font-mono text-[10px] tracking-widest px-4 py-1.5 rounded-full border ${typeColor[item.type] ?? "text-gray-cool bg-gray-cool/10 border-gray-cool/25"}`}
                                >
                                    {item.type}
                                </span>
                            </div>

                            {/* Right — content */}
                            <div>
                                <h3
                                    className="font-display font-bold text-ivory mb-2 group-hover:text-gray-cool transition-colors duration-300"
                                    style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)" }}
                                >
                                    {item.role}
                                </h3>
                                <p className="font-mono text-xs tracking-wider text-gray-cool uppercase mb-5">
                                    {item.company}
                                </p>
                                <div
                                    className="w-8 mb-5"
                                    style={{ height: "1px", background: "rgba(255,255,255,0.12)" }}
                                />
                                <p className="text-gray-lighter text-sm leading-relaxed mb-6 max-w-xl">
                                    {item.description}
                                </p>

                                {/* Skill pills */}
                                <div className="flex flex-wrap gap-2">
                                    {item.skills.map((skill) => (
                                        <span
                                            key={skill}
                                            className="font-mono text-[10px] tracking-wider uppercase text-ivory/40 border px-4 py-1.5 rounded-full"
                                            style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
                                        >
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

            </div>
        </section>
    );
}

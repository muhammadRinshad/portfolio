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

export default function Experience() {
    return (
        <section
            id="experience"
            className="w-full bg-transparent"
            style={{ padding: "clamp(1rem, 4vw, 6rem) 0" }}
        >
            <div className="section-content">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.65, ease }}
                    className="flex items-end justify-between"
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "clamp(1rem, 2.5vw, 2.5rem)", marginBottom: "clamp(1rem, 2.5vw, 2.5rem)" }}
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
                            className="group grid grid-cols-1 lg:grid-cols-[420px_1fr] lg:gap-20"
                            style={{ padding: "clamp(0.75rem, 2vw, 3rem) 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                        >
                            {/* Left — period + type badge (desktop only) */}
                            <div className="hidden lg:flex lg:flex-col gap-4 lg:pt-1">
                                <span className="font-mono text-[11px] tracking-widest text-ivory/40 uppercase whitespace-nowrap">
                                    {item.period}
                                </span>
                            </div>

                            {/* Right — content */}
                            <div>
                                <h3
                                    className="font-display font-bold text-ivory group-hover:text-gray-cool transition-colors duration-300"
                                    style={{ fontSize: "clamp(1.1rem, 1.8vw, 1.4rem)", marginBottom: "0.35rem" }}
                                >
                                    {item.role}
                                </h3>
                                {/* Period shown inline on mobile */}
                                <p className="font-mono text-[10px] tracking-wider text-ivory/30 uppercase lg:hidden" style={{ marginBottom: "0.4rem" }}>
                                    {item.period}
                                </p>
                                <p className="font-mono text-xs tracking-wider text-gray-cool uppercase" style={{ marginBottom: "0.75rem" }}>
                                    {item.company}
                                </p>
                                <div
                                    className="w-8"
                                    style={{ height: "1px", background: "rgba(255,255,255,0.12)", marginBottom: "0.75rem" }}
                                />
                                <p className="text-gray-lighter text-sm leading-relaxed" style={{ marginBottom: "0.75rem", maxWidth: "56ch" }}>
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

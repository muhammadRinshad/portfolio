"use client";

import { motion } from "framer-motion";

const education = [
    {
        id: 1,
        degree: "MERN Stack Development",
        institution: "Harris and Co Academy, Calicut, Kerala",
        period: "Jun 2025 – Jan 2026",
        description:
            "Intensive training on full-stack development using MongoDB, Express.js, React, and Node.js.",
    },
    {
        id: 2,
        degree: "Bachelor of Computer Applications (BCA)",
        institution: "Nasra College of Arts and Science, Kerala",
        period: "2022 – 2025",
        description:
            "Degree covering programming, algorithms, database management, and software engineering principles.",
    },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export default function Education() {
    return (
        <section
            id="education"
            className="w-full bg-transparent"
            style={{ padding: "clamp(2.5rem, 5vw, 4.5rem) 0" }}
        >
            <div className="section-content">
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-start">

                    {/* Left — heading */}
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        transition={{ duration: 0.65, ease }}
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-[1px] w-12 bg-gray-cool" />
                            <span className="text-gray-cool font-mono text-xs tracking-widest uppercase">
                                Academic Background
                            </span>
                        </div>
                        <h2
                            className="font-display font-black text-ivory leading-none"
                            style={{ fontSize: "clamp(2.2rem, 4.5vw, 4.5rem)" }}
                        >
                            MY
                            <br />
                            <span className="text-gray-cool opacity-50">EDUCATION</span>
                        </h2>

                        <motion.div
                            initial={{ scaleY: 0 }}
                            whileInView={{ scaleY: 1 }}
                            viewport={{ once: true, amount: 0.3 }}
                            transition={{ duration: 0.9, ease, delay: 0.3 }}
                            style={{ originY: 0 }}
                            className="hidden lg:block w-[1px] h-16 bg-gray-cool/30 mt-8"
                        />
                    </motion.div>

                    {/* Right — cards */}
                    <div className="flex flex-col gap-5">
                        {education.map((item, i) => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, y: 32 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, amount: 0.2 }}
                                transition={{ duration: 0.6, ease, delay: i * 0.15 }}
                                className="bg-charcoal-light/10 border border-ivory/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 hover:bg-charcoal-light/20 transition-colors duration-500"
                            >
                                <span className="font-mono text-xs text-ivory/60 bg-ivory/5 px-3 py-1 rounded-full inline-block mb-3">
                                    {item.period}
                                </span>
                                <h3
                                    className="font-display font-bold text-ivory mb-1"
                                    style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)" }}
                                >
                                    {item.degree}
                                </h3>
                                <h4 className="font-sans text-sm text-gray-cool font-medium mb-3">
                                    {item.institution}
                                </h4>
                                <p className="text-gray-lighter text-sm leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

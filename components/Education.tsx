"use client";

import { motion, useAnimation } from "framer-motion";
import { useRef, useEffect } from "react";

const PAUSE_MS = 1600; // ms to hold scroll while animation plays

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

export default function Education() {
    const sectionRef = useRef<HTMLElement>(null);
    const controls = useAnimation();
    const hasPlayed = useRef(false);

    useEffect(() => {
        /* explicitly initialise to hidden so elements never flash before observer fires */
        controls.set("hidden");
    }, [controls]);

    useEffect(() => {
        const el = sectionRef.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                // Only trigger when the card has reached the stack position (near top)
                if (
                    entry.isIntersecting &&
                    entry.boundingClientRect.top < 260 &&
                    !hasPlayed.current
                ) {
                    hasPlayed.current = true;

                    // Pause Lenis scroll while animation plays
                    window.dispatchEvent(new CustomEvent("scroll-pause"));

                    controls.start("visible");

                    setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("scroll-resume"));
                    }, PAUSE_MS);
                }
            },
            { threshold: [0.5, 0.75, 0.95] }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [controls]);

    const container = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.22, delayChildren: 0.05 },
        },
    };

    const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

    // Top-down clip reveal: content is uncovered from the top edge downward
    const revealDown = {
        hidden: { clipPath: "inset(0% 0% 100% 0%)" },
        visible: {
            clipPath: "inset(0% 0% 0% 0%)",
            transition: { duration: 0.65, ease },
        },
    };

    // Heading: slide up + fade
    const revealUp = {
        hidden: { opacity: 0, y: 40 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.65, ease },
        },
    };

    return (
        <section
            ref={sectionRef}
            id="education"
            className="w-full bg-transparent"
            style={{ padding: "clamp(2.5rem, 5vw, 4.5rem) 0" }}
        >
            <div className="section-content">
                <motion.div
                    variants={container}
                    initial="hidden"
                    animate={controls}
                    className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-10 lg:gap-16 items-start"
                >
                    {/* Left — section heading */}
                    <motion.div variants={revealUp}>
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

                        {/* Decorative vertical line */}
                        <motion.div
                            variants={{
                                hidden: { scaleY: 0, originY: 0 },
                                visible: {
                                    scaleY: 1,
                                    transition: { duration: 0.9, ease, delay: 0.3 },
                                },
                            }}
                            className="hidden lg:block w-[1px] h-16 bg-gray-cool/30 mt-8"
                        />
                    </motion.div>

                    {/* Right — education cards revealed top-down */}
                    <div className="flex flex-col gap-5">
                        {education.map((item) => (
                            <motion.div
                                key={item.id}
                                variants={revealDown}
                                className="bg-charcoal-light/10 border border-ivory/5 backdrop-blur-xl rounded-2xl p-6 sm:p-8 hover:bg-charcoal-light/20 transition-colors duration-500 group"
                            >
                                <span className="font-mono text-xs text-ivory/60 bg-ivory/5 px-3 py-1 rounded-full inline-block mb-3">
                                    {item.period}
                                </span>
                                <h3 className="font-display font-bold text-ivory mb-1"
                                    style={{ fontSize: "clamp(1rem, 1.6vw, 1.25rem)" }}>
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
                </motion.div>
            </div>
        </section>
    );
}

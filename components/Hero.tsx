"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import ParticleText from "./ParticleText";

const PHOTO = "/me.png";

interface HeroProps {
    onEnter?: () => void;
}

export default function Hero({ onEnter }: HeroProps) {
    const heroRef = useRef<HTMLElement | null>(null);

    return (
        <section
            ref={heroRef}
            id="home"
            className="relative min-h-screen flex flex-col lg:flex-row overflow-hidden cursor-pointer select-none"
            style={{ background: "#F5F5F0" }}
            onClick={onEnter}
        >
            {/* Name & Designation — top on mobile, left on desktop */}
            <div className="section-content flex-1 flex flex-col justify-center pr-4 z-10">
                <motion.span
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="font-mono text-[10px] sm:text-xs tracking-[0.28em] text-gray-400 uppercase mb-5 block"
                >
                    MERN Stack Developer
                </motion.span>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.1 }}
                >
                    <ParticleText
                        lines={["MUHAMMED", "RINSHAD"]}
                        heroRef={heroRef}
                    />
                </motion.div>
            </div>

            {/* Mobile photo — below the name, hidden on desktop */}
            <div className="lg:hidden relative w-full" style={{ height: "44vh" }}>
                <Image
                    src={PHOTO}
                    alt="Muhammed Rinshad"
                    fill
                    className="object-contain object-center"
                    priority
                />
            </div>

            {/* Desktop right spacer — photo comes from fixed layer in page.tsx */}
            <div className="hidden lg:flex flex-1" />

            {/* Click-to-explore hint */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 1 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 pointer-events-none"
                style={{ zIndex: 10 }}
            >
                <span className="font-mono text-[10px] sm:text-xs tracking-[0.3em] uppercase text-gray-400">
                    Click to explore
                </span>
                <div className="relative w-10 h-10 flex items-center justify-center">
                    <motion.div
                        className="absolute inset-0 rounded-full border border-gray-300"
                        animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut" }}
                    />
                    <motion.div
                        className="absolute inset-0 rounded-full border border-gray-300"
                        animate={{ scale: [1, 1.7], opacity: [0.6, 0] }}
                        transition={{ repeat: Infinity, duration: 1.6, ease: "easeOut", delay: 0.5 }}
                    />
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                </div>
            </motion.div>
        </section>
    );
}

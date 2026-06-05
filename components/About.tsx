"use client";

import Image from "next/image";
import { motion } from "framer-motion";

const PHOTO = "/Gemini_Generated_Image_46qz8346qz8346qz-Picsart-BackgroundRemover cropped.png";

export default function About() {
    return (
        <section id="about" className="relative flex flex-col lg:flex-row min-h-screen w-full bg-transparent overflow-hidden">

            {/* Decorative background text */}
            <div className="absolute top-20 lg:top-32 left-0 w-full overflow-hidden leading-none opacity-[0.04] select-none pointer-events-none z-0">
                <div className="font-display font-black text-[18vw] whitespace-nowrap text-ivory">
                    ABOUT ME ABOUT ME
                </div>
            </div>

            {/* Text content — full width on mobile, left column on desktop */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="section-content flex-1 min-w-0 flex flex-col justify-center relative z-10 py-14 sm:py-20 lg:py-0 pr-4"
            >
                <div className="w-full max-w-[520px]">
                    <span className="text-gray-cool font-mono text-sm tracking-widest uppercase mb-4 block">
                        Who I Am
                    </span>

                    <h2
                        className="font-display font-bold leading-tight mb-6 sm:mb-8"
                        style={{ fontSize: "clamp(2rem, 3.6vw, 3.75rem)" }}
                    >
                        Design-Driven <br />
                        <span className="text-gray-cool italic font-serif">MERN Stack Developer</span>
                    </h2>

                    <div className="space-y-4 text-gray-lighter leading-relaxed font-sans" style={{ fontSize: "clamp(0.9rem, 1.4vw, 1.125rem)" }}>
                        <p>
                            MERN Stack Developer with a BCA degree and strong hands-on experience in building
                            full-stack web applications using MongoDB, Express, React, and Node.js.
                        </p>
                        <p>
                            Developed a complete social media application and multiple mini-projects. Built and
                            deployed live landing pages using Next.js, TypeScript, and Framer Motion. A proactive
                            team player with leadership skills and a passion for building scalable web solutions.
                        </p>
                    </div>
                </div>
            </motion.div>

            {/* Mobile photo — below text, hidden on desktop */}
            <div className="lg:hidden relative w-full" style={{ height: "65vw", maxHeight: "360px" }}>
                <Image
                    src={PHOTO}
                    alt="Muhammed Rinshad"
                    fill
                    className="object-contain object-bottom"
                    priority
                />
            </div>

            {/* Desktop photo — right column, hidden on mobile */}
            <div className="hidden lg:block relative" style={{ width: "50vw", flexShrink: 0 }}>
                <div className="absolute inset-0">
                    <Image
                        src={PHOTO}
                        alt="Muhammed Rinshad"
                        fill
                        className="object-contain object-bottom"
                        priority
                    />
                </div>
            </div>
        </section>
    );
}
